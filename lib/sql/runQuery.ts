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
    page: number
    PAGE_SIZE: number
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
        relationships,
        page,
        PAGE_SIZE = 100
    }: RunQueryArgs,
    overrideQuery?: string
) => {
    const startTime = performance.now()

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

    // Pagination: 
    finalQuery = finalQuery.replace(/;+\s*$/, "").trim()
    finalQuery = finalQuery.replace(/limit\s+\d+/gi, "").replace(/offset\s+\d+/gi, "").trim()
    const limitMatch = finalQuery.match(/limit\s+(\d+)/i)
    if (limitMatch) {
        const currentLimit = Number(limitMatch[1])
        if (currentLimit > PAGE_SIZE) {
            finalQuery = finalQuery.replace(
                /limit\s+\d+/i,
                `LIMIT ${PAGE_SIZE}`
            )
        }
    } else {
        finalQuery += ` LIMIT ${PAGE_SIZE} OFFSET ${page * PAGE_SIZE}`
    }

    // Timeout protection:
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 8000)
    )

    try {
        const result = await Promise.race([
            conn.query(finalQuery),
            timeoutPromise
        ]) as any
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
        if (formatted.length > 1000) {
            setError("Query returned too many rows.")
            setQueryResult([])
            return
        }
        const resultSize = JSON.stringify(formatted, (_, value) =>
            typeof value === "bigint"
                ? value.toString()
                : value
        ).length
        if (resultSize > 2_000_000) {
            setError("Query result too large.")
            setQueryResult([])
            return
        }

        const executionTime = performance.now() - startTime
        console.log("QUERY AUDIT", {
            query,
            sql: finalQuery,
            rows: formatted.length,
            executionTime
        })

        setQueryResult(formatted)
    } catch (err) {
        const errorMsg = String(err)
        setQueryResult([])
        console.error(err)
        setError(errorMsg)

        console.log("QUERY FAILURE", {
            query,
            sql: finalQuery,
            error: errorMsg
        })

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
                        relationships,
                        page,
                        PAGE_SIZE
                    },
                    sql
                )
        })
    } finally {
        await conn.close()
    }
}
