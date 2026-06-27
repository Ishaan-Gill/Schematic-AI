import { getDuckDB } from "@/lib/duckdb"
import { isFollowUpQuery, isTimeQuery } from "@/lib/ai/followUp"
import { updateDetectedRelationships } from "@/lib/upload/metadata/detectRelationships"
import { validateSQL } from "./validateSQL"
import { buildDatasetContext } from "../metadata/buildDatasetContext"
import { feedbackMemory } from "@/lib/upload/metadata/feedbackMemory"
import { detectTableRelevance, expandRelevantTables } from "../ai/detectTableRelevance"
import { quoteIdentifier } from "../utils/quoteIdentifier"

type GenerateSQLArgs = {
    query: string
    schemas: Record<string, any[]>
    lastSQL: string
    setError: (val: string | null) => void
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    setLastSQL: React.Dispatch<React.SetStateAction<string>>
    signal?: AbortSignal
    guard?: () => boolean
}

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
    !signal?.aborted && (guard?.() ?? true)

export const generateSQL = async ({
    query,
    schemas,
    lastSQL,
    setError,
    setLoading,
    setLastSQL,
    signal,
    guard,
}: GenerateSQLArgs): Promise<string | undefined> => {

    setError(null)

    const relationships = updateDetectedRelationships(schemas)
    const isFollowUp = isFollowUpQuery(query, lastSQL)
    const relevantTables = detectTableRelevance(query, schemas)
    const finalRelevantTables = expandRelevantTables(
        relevantTables,
        relationships
    )
    if (finalRelevantTables.length === 0) {
        setError("No datasets loaded. Please upload a file first.")
        return
    }

    setLoading(true)
    
    let conn: any = null
    try {
        const db = await getDuckDB()
        conn = await db.connect()
        
        if (!isActive(guard, signal)) return

        // Database Context:
        const sampleRowsByTable: Record<string, any[]> = {}

        for (const tableName of finalRelevantTables) {
            const sampleRows = await conn.query(`SELECT * FROM ${quoteIdentifier(tableName)} LIMIT 3`)
            sampleRowsByTable[tableName] = sampleRows.toArray()
        }
        const relevantSchemas = Object.fromEntries(
            finalRelevantTables.map((table) => [table, schemas[table]]).filter(([, schema]) => schema)
        )
        const finalDatasetContext = buildDatasetContext(relevantSchemas, sampleRowsByTable)

        // Time hint
        const timeHint = isTimeQuery(query)
            ? `
                Time-based analytics query.
                Prefer DATE_TRUNC, EXTRACT, proper date filtering,
                and relative date logic where appropriate.
            `
            : ""

        const endpoint = isFollowUp && lastSQL ? "/api/edit-sql" : "/api/generate-sql"
        const body =
            endpoint === "/api/edit-sql"
                ? { query, lastSQL, schemas, relationships, isFollowUp }
                : { query, schemas, relevantTables: finalRelevantTables, relationships, sampleRowsByTable, finalDatasetContext, feedbackMemory, timeHint }

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
        if (!res.ok) {
            setError(data.error || "Something went wrong. Please try again.")
            return
        }

        if (!isActive(guard, signal)) return

        if (!isFollowUp) setLastSQL("")

        if (!data.sql) {
            setError("Something went wrong. Please try again.")
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
        setLastSQL(freshSQL)

        return freshSQL

    } catch (err) {
        if (signal?.aborted) return
        console.error("AI error:", err)
    } finally {
        if (isActive(guard, signal)) {
            setLoading(false)
        }
        if (conn) await conn.close()
    }
}
