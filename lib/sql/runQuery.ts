import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { fixQueryWithAI } from "@/lib/sql/fixQuery"
import { suggestFix } from "@/lib/sql/suggestFix"
import { feedbackMemory } from "../upload/metadata/feedbackMemory"

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
    signal?: AbortSignal
    guard?: () => boolean
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>
}

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
    !signal?.aborted && (guard?.() ?? true)

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
        PAGE_SIZE = 100,
        signal,
        guard,
        setHasMore
    }: RunQueryArgs,
    overrideQuery?: string
) => {
    const startTime = performance.now()

    if (!selectedTable || !isActive(guard, signal)) return

    setError(null)

    const db = await getDuckDB()
    const conn = await db.connect()

    let baseQuery =
        overrideQuery?.trim()
        || generatedSQL?.trim()
        || `SELECT * FROM "${selectedTable}" LIMIT 10`

    // Pagination
    let finalQuery = `
    SELECT *
    FROM (
        ${baseQuery}
    ) AS paginated_query
    LIMIT ${PAGE_SIZE + 1}
    OFFSET ${page * PAGE_SIZE}
`

    // Timeout protection:
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise((_, reject) =>
        timeoutId = setTimeout(() => reject(new Error("Query timeout")), 8000)
    )

    try {
        const result = await Promise.race([
            conn.query(finalQuery),
            timeoutPromise
        ]) as any

        if (!isActive(guard, signal)) return

        const rawRows = result.toArray().map((row: any) => ({ ...row }))

        const hasMore = rawRows.length > PAGE_SIZE

        const formatted = hasMore
            ? rawRows.slice(0, PAGE_SIZE)
            : rawRows

        setHasMore(hasMore)

        if (formatted.length === 0) {
            await suggestFix({
                userQuery: query,
                schemas,
                selectedTable,
                setError,
                relationships,
                signal,
                guard
            })
            if (!isActive(guard, signal)) return
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

        feedbackMemory.push({
            query,
            generatedSQL: finalQuery,
            outcome: "success",
            timestamp: Date.now(),
        })
        console.log("FEEDBACK MEMORY:", feedbackMemory)

        console.log("QUERY AUDIT", {
            query,
            sql: finalQuery,
            rows: formatted.length,
            executionTime
        })

        setQueryResult(formatted)
    } catch (err) {
        const errorMsg = String(err)

        feedbackMemory.push({
            query,
            generatedSQL: finalQuery,
            outcome: "failure",
            error: errorMsg,
            timestamp: Date.now(),
        })

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
            badQuery: baseQuery,
            errorMsg,
            schemas,
            selectedTable,
            setGeneratedSQL,
            relationships,
            signal,
            guard,
        })
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        await conn.close()
    }
}
