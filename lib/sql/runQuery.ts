import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { fixQueryWithAI } from "@/lib/sql/fixQuery"
import { suggestFix } from "@/lib/sql/suggestFix"
import { addFeedbackMemory } from "../upload/metadata/feedbackMemory"
import type { Relationship } from "../ai/relationships"
import { getRelationshipsMemory } from "../ai/relationshipsMap"
import { validateSQL } from "./validateSQL"


type RunQueryArgs = {
    relevantTables?: string[]
    generatedSQL: string
    query: string
    schemas: Record<string, any[]>
    setError: (val: string | null) => void
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
    setQueryResult: React.Dispatch<React.SetStateAction<any[]>>
    relationships: Relationship[]
    page: number
    PAGE_SIZE: number
    signal?: AbortSignal
    guard?: () => boolean
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>
    fixAttemptsRef: React.MutableRefObject<number>
}

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
    !signal?.aborted && (guard?.() ?? true)

export const runQuery = async (
    {
        relevantTables,
        generatedSQL,
        query,
        schemas,
        setError,
        setGeneratedSQL,
        setQueryResult,
        relationships,
        page,
        PAGE_SIZE = 100,
        signal,
        guard,
        setHasMore,
        fixAttemptsRef,
    }: RunQueryArgs,
    overrideQuery?: string
) => {
    const startTime = performance.now()

    if (!isActive(guard, signal)) return

    setError(null)

    const db = await getDuckDB()
    const conn = await db.connect()

    let baseQuery =
        overrideQuery?.trim()
        || generatedSQL?.trim()

    // To remove ```, ; from sql
    baseQuery = baseQuery
        .trim()
        .replace(/;+$/, "")
        .replace(/```sql/g, "")
        .replace(/```/g, "")

    // Queries that should NOT be paginated (describe, show)
    const isNonPaginated = /^(describe|show)\b/i.test(baseQuery.trim())

    // Pagination
    let finalQuery = isNonPaginated
        ? baseQuery
        : `
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
        setError(null)

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

        const validationError = await validateSQL({ sql: finalQuery })
        if (validationError) {
            setError(validationError)
            return
        }

        if (formatted.length === 0) {
            await suggestFix({
                userQuery: query,
                schemas,
                relevantTables,
                setError,
                relationships: getRelationshipsMemory(),
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

        addFeedbackMemory({
            query,
            generatedSQL: finalQuery,
            outcome: "success",
            timestamp: Date.now(),
        })

        if (process.env.NEXT_PUBLIC_DEBUG === "true") {
            console.log("FEEDBACK MEMORY (SUCCESS):", addFeedbackMemory)
        }
        if (process.env.NEXT_PUBLIC_DEBUG === "true") {
            console.log("QUERY AUDIT", {
                query,
                sql: finalQuery,
                rows: formatted.length,
                executionTime
            })
        }

        setQueryResult(formatted)
    } catch (err) {
        const errorMsg = String(err)

        addFeedbackMemory({
            query,
            generatedSQL: baseQuery,
            outcome: "failure",
            error: errorMsg,
            timestamp: Date.now(),
        })

        if (process.env.NEXT_PUBLIC_DEBUG === "true") {
            console.log("FEEDBACK MEMORY (FAILURE):", addFeedbackMemory)
        }
        setQueryResult([])
        setHasMore(false)
        setGeneratedSQL("")
        console.error(err)

        if (process.env.NEXT_PUBLIC_DEBUG === "true") {
            console.log("QUERY FAILURE", {
                query,
                sql: finalQuery,
                error: errorMsg
            })
        }

        await suggestFix({
            userQuery: query,
            schemas,
            relevantTables,
            setError,
            relationships,
            signal,
            guard,
            error: errorMsg
        })

        if (fixAttemptsRef.current >= 2) {
            setError("AI could not fix this query.")
            return
        }
        fixAttemptsRef.current += 1

        await fixQueryWithAI({
            badQuery: baseQuery,
            errorMsg,
            schemas,
            setGeneratedSQL,
            relationships: getRelationshipsMemory(),
            setError,
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
