import React from "react"

import { getDuckDB } from "@/lib/duckdb"
import { suggestFix } from "@/lib/sql/suggestFix"
import { addFeedbackMemory } from "../upload/metadata/feedbackMemory"
import type { Relationship } from "../ai/context/relationships"
import { getRelationshipsMemory } from "../ai/context/relationshipsMap"
import { validateSQL } from "./validateSQL"
import { Message } from "@/types/message"
import { buildExecutableSQL } from "./buildExecutableSQL"
import { validateQueryResult } from "./validateQueryResult"
import { recoverFailedQuery } from "./recoverFailedQuery"


type RunQueryArgs = {
    relevantTables?: string[]
    sql: string
    query: string
    schemas: Record<string, any[]>
    relationships: Relationship[]
    page: number
    PAGE_SIZE: number
    signal?: AbortSignal
    guard?: () => boolean
    fixAttemptsRef: React.MutableRefObject<number>
    assistantMessageId: string
    updateMessage: (
        id: string,
        updates: Partial<Message>
    ) => void
}

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
    !signal?.aborted && (guard?.() ?? true)

export const runQuery = async (
    {
        relevantTables,
        sql,
        query,
        schemas,
        relationships,
        page,
        PAGE_SIZE = 100,
        signal,
        guard,
        fixAttemptsRef,
        assistantMessageId,
        updateMessage
    }: RunQueryArgs
) => {
    const startTime = performance.now()

    if (!isActive(guard, signal)) return

    updateMessage(assistantMessageId, {
        error: undefined,
    })

    const { baseQuery, finalQuery } = buildExecutableSQL({
        sql,
        page,
        PAGE_SIZE: PAGE_SIZE,
    })

    // Timeout protection:
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise((_, reject) =>
        timeoutId = setTimeout(() => reject(new Error("Query timeout")), 8000)
    )

    let conn: any = null
    try {
        updateMessage(assistantMessageId, {
            error: undefined,
        })
        const db = await getDuckDB()
        conn = await db.connect()

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

        updateMessage(assistantMessageId, {
            hasMore,
        })

        const validationError = await validateSQL({ sql: finalQuery })
        if (validationError) {
            updateMessage(assistantMessageId, {
                error: validationError,
                loading: false
            })
            return
        }

        if (formatted.length === 0) {
            await suggestFix({
                userQuery: query,
                schemas,
                relevantTables,
                relationships: getRelationshipsMemory(),
                signal,
                guard,
                assistantMessageId,
                updateMessage
            })
            if (!isActive(guard, signal)) return
        }

        const queryResultValidation = validateQueryResult({
            rows: formatted,
        })
        if (queryResultValidation) {
            updateMessage(assistantMessageId, {
                error: queryResultValidation,
                queryResult: [],
                loading: false
            })
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

        updateMessage(assistantMessageId, {
            queryResult: formatted,
            loading: false
        })

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
        updateMessage(assistantMessageId, {
            hasMore: false
        })
        console.error(err)

        if (process.env.NEXT_PUBLIC_DEBUG === "true") {
            console.log("QUERY FAILURE", {
                query,
                sql: finalQuery,
                error: errorMsg
            })
        }

        const fixedSQL = await recoverFailedQuery({
            query,
            baseQuery,
            errorMsg,
            schemas,
            relevantTables,
            relationships,
            signal,
            guard,
            fixAttemptsRef,
            assistantMessageId,
            updateMessage,
        })
        if (!fixedSQL) {
            updateMessage(assistantMessageId, {
                loading: false
            })
            return
        }

        await runQuery({
            relevantTables,
            sql: fixedSQL,
            query,
            schemas,
            relationships,
            page,
            PAGE_SIZE,
            signal,
            guard,
            fixAttemptsRef,
            assistantMessageId,
            updateMessage,
        })
        return

    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        if (conn) await conn.close()
    }
}
