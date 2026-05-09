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

    const trimmedQuery = query.trim()

    const manualSQL =
        /^(SELECT|WITH|SHOW|DESCRIBE|PRAGMA|EXPLAIN)/i.test(trimmedQuery)

    let finalQuery = ""

    if (overrideQuery?.trim()) {
        finalQuery = overrideQuery.trim()
    } else if (manualSQL) {
        finalQuery = trimmedQuery
    } else if (trimmedQuery.length > 0) {
        setError("Please enter valid SQL or use Ask AI.")
        await conn.close()
        return
    } else {
        finalQuery = `SELECT * FROM ${selectedTable} LIMIT 10`
    }

    // Timeout protection:
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 8000)
    )
    const result = await Promise.race([
        conn.query(finalQuery),
        timeoutPromise
    ])

    console.log("Running Query:", finalQuery)

    try {
        const result = await conn.query(finalQuery)
        const formatted = result.toArray().map((row: any) => ({ ...row }))

        if (formatted.length === 0) {
            await suggestFix({
                userQuery: query,
                schemas,
                selectedTable,
                setError,
                relationships
            })
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
