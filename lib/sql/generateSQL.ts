import { getDuckDB } from "@/lib/duckdb"
import { isFollowUpQuery, isTimeQuery } from "@/lib/ai/followUp"
import { updateDetectedRelationships } from "@/lib/upload/metadata/detectRelationships"
import { validateSQL } from "./validateSQL"
import { buildDatasetContext } from "../metadata/buildDatasetContext"
import { feedbackMemory } from "@/lib/upload/metadata/feedbackMemory"


type GenerateSQLArgs = {
    selectedTable: string | null
    query: string
    schemas: Record<string, any[]>
    generatedSQL: string
    lastSQL: string
    setError: (val: string | null) => void
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
    setLastSQL: React.Dispatch<React.SetStateAction<string>>
    signal?: AbortSignal
    guard?: () => boolean
    expectedTable: string | null
}

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
    !signal?.aborted && (guard?.() ?? true)

export const generateSQL = async ({
    selectedTable,
    query,
    schemas,
    generatedSQL,
    lastSQL,
    setError,
    setLoading,
    setGeneratedSQL,
    setLastSQL,
    signal,
    guard,
    expectedTable
}: GenerateSQLArgs) => {
    if (!selectedTable) return

    setError(null)
    setLoading(true)

    const relationships = updateDetectedRelationships(schemas)
    const isFollowUp = isFollowUpQuery(query)
    const db = await getDuckDB()
    const conn = await db.connect()

    try {
        if (!isActive(guard, signal)) return

        const datasetContext = await Promise.all(
            Object.keys(schemas).map(async (tableName) => {
                const sampleRows = await conn.query(
                    `SELECT * FROM "${tableName}" LIMIT 3`
                )
                return `
                    TABLE: ${tableName}
                    ${buildDatasetContext(
                    schemas[tableName],
                    sampleRows.toArray()
                )}
                `
            })
        )

        const finalDatasetContext = datasetContext.join("\n\n")

        const endpoint = isFollowUp && lastSQL ? "/api/edit-sql" : "/api/generate-sql"
        const body =
            endpoint === "/api/edit-sql"
                ? { query, lastSQL: generatedSQL, schemas, relationships, isFollowUp }
                : { query, schemas, selectedTable, relationships, finalDatasetContext, feedbackMemory }

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify(body, (_, value) =>
                typeof value === "bigint"
                    ? value.toString()
                    : value
            )
        })
        const data = await res.json()
        if (!isActive(guard, signal)) return

        if (expectedTable !== selectedTable) return

        if (isTimeQuery(query) && query.toLowerCase().includes("select")) {
            console.log("Time-oriented query detected")
        }

        if (!isFollowUp) setLastSQL("")

        if (!data.sql) {
            setError("AI failed to generate SQL")
            return
        }

        // validateSQL:
        const validationError = await validateSQL({
            sql: data.sql,
        })
        if (validationError) {
            setError(validationError)
            return
        }

        const freshSQL = data.sql
        setGeneratedSQL(freshSQL)
        setLastSQL(freshSQL)

    } catch (err) {
        if (signal?.aborted) return
        console.error("AI error:", err)
    } finally {
        if (isActive(guard, signal)) {
            setLoading(false)
        }
        await conn.close()
    }
}
