import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { isFollowUpQuery, isTimeQuery } from "@/lib/ai/followUp"
import { detectRelationships } from "@/lib/ai/relationships"
import { getSQLValidationError } from "@/lib/ai/validations"

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
}

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
    runQuery
}: GenerateSQLArgs) => {
    if (!selectedTable) return

    setError(null)
    setLoading(true)

    const relationships = detectRelationships(schemas)
    const isFollowUp = isFollowUpQuery(query)
    const db = await getDuckDB()
    const conn = await db.connect()

    try {
        const sampleRows = await conn.query(`SELECT * FROM ${selectedTable} LIMIT 5`)
        const sampleText = sampleRows
            .toArray()
            .map((row: any) => Object.values(row).join(", "))
            .join("\n")

        const endpoint = isFollowUp || lastSQL ? "/api/edit-sql" : "/api/generate-sql"
        const body =
            endpoint === "/api/edit-sql"
                ? { query, lastSQL: generatedSQL, schemas, relationships, isFollowUp }
                : { query, schemas, sampleText, selectedTable, relationships }

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })
        const data = await res.json()
        const sql = String(data.sql ?? "").toLowerCase()

        if (isTimeQuery(query) && query.toLowerCase().includes("select")) {
            console.log("Time-oriented query detected")
        }

        if (!isFollowUp) setLastSQL("")

        console.log("RELATIONSHIPS:", relationships)
        console.log("AI RESPONSE:", data)
        console.log("AI SQL:", data.sql)

        setGeneratedSQL(data.sql)
        setLastSQL(data.sql)
        await runQuery(data.sql)
    } catch (err) {
        console.error("AI error:", err)
    } finally {
        setLoading(false)
        await conn.close()
    }
}
