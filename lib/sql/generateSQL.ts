import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { isFollowUpQuery, isTimeQuery } from "@/lib/ai/followUp"
import { detectRelationships } from "@/lib/ai/relationships"
import { validateSQL } from "./validateSQL"

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
    runQuery: (sql?: string) => Promise<void>
    signal?: AbortSignal
    guard?: () => boolean
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
    runQuery,
    signal,
    guard
}: GenerateSQLArgs) => {
    if (!selectedTable) return

    setError(null)
    setLoading(true)

    const relationships = detectRelationships(schemas)
    const isFollowUp = isFollowUpQuery(query)
    const db = await getDuckDB()
    const conn = await db.connect()

    try {
        if (!isActive(guard, signal)) return

        const sampleRows = await conn.query(`SELECT * FROM ${selectedTable} LIMIT 5`)
        const sampleText = sampleRows
            .toArray()
            .map((row: any) => Object.values(row).join(", "))
            .join("\n")
        if (!isActive(guard, signal)) return

        const endpoint = isFollowUp && lastSQL ? "/api/edit-sql" : "/api/generate-sql"
        const body =
            endpoint === "/api/edit-sql"
                ? { query, lastSQL: generatedSQL, schemas, relationships, isFollowUp }
                : { query, schemas, sampleText, selectedTable, relationships }

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify(body)
        })
        const data = await res.json()
        if (!isActive(guard, signal)) return

        if (isTimeQuery(query) && query.toLowerCase().includes("select")) {
            console.log("Time-oriented query detected")
        }

        if (!isFollowUp) setLastSQL("")

        if (!data.sql) {
            setError("AI failed to generate SQL")
            return
        }

        console.log("RELATIONSHIPS:", relationships)
        console.log("AI RESPONSE:", data)
        console.log("AI SQL:", data.sql)

        // validateSQL:
        const validationError = await validateSQL({
            sql: data.sql,
        })
        if (validationError) {
            setError(validationError)
            return
        }

        const freshSQL = data.sql
        setGeneratedSQL(data.sql)
        setLastSQL(data.sql)
        await runQuery(freshSQL)

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
