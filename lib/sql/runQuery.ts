import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { fixQueryWithAI } from "@/lib/sql/fixQuery"
import { suggestFix } from "@/lib/sql/suggestFix"

type RunQueryArgs = {
    selectedTable: string | null
    generatedSQL: string
    query: string
    schema: any[]
    schemas: Record<string, any[]>
    setError: (val: string | null) => void
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
    setQueryResult: React.Dispatch<React.SetStateAction<any[]>>
    retryCount?: number
    relationships: string[]
}

export const runQuery = async (
    {
        selectedTable,
        generatedSQL,
        query,
        schema,
        schemas,
        setError,
        setGeneratedSQL,
        setQueryResult,
        retryCount = 0,
        relationships
    }: RunQueryArgs,
    overrideQuery?: string
) => {
    if (!selectedTable) return

    setError(null)

    const db = await getDuckDB()
    const conn = await db.connect()
    const finalQuery = overrideQuery || generatedSQL || `SELECT * FROM ${selectedTable} LIMIT 10`

    console.log("Running Query:", finalQuery)

    try {
        const result = await conn.query(finalQuery)
        const formatted = result.toArray().map((row: any) => ({ ...row }))

        if (formatted.length === 0) {
            await suggestFix({ userQuery: query, schema, schemas, selectedTable, setError })
        }

        setQueryResult(formatted)
    } catch (err) {
        const errorMsg = String(err)
        setQueryResult([])
        console.error(err)
        setError(errorMsg)

        if (retryCount >= 2) {
            setError("AI could not fix this query.")
            return
        }

        await fixQueryWithAI({
            badQuery: finalQuery,
            errorMsg,
            schemas,
            selectedTable,
            setGeneratedSQL,
            relationships,
            runQuery: (sql?: string) =>
                runQuery(
                    {
                        selectedTable,
                        generatedSQL,
                        query,
                        schema,
                        schemas,
                        setError,
                        setGeneratedSQL,
                        setQueryResult,
                        retryCount: retryCount + 1,
                        relationships
                    },
                    sql
                )
        })
    } finally {
        await conn.close()
    }
}
