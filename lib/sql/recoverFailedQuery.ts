import { Message } from "@/types/message"
import { Relationship } from "../ai/relationships"
import { fixQueryWithAI } from "./fixQuery"
import { suggestFix } from "./suggestFix"

type RecoverFailedQueryArgs = {
    query: string
    baseQuery: string
    errorMsg: string
    schemas: Record<string, any[]>
    relevantTables?: string[]
    relationships: Relationship[]
    signal?: AbortSignal
    guard?: () => boolean
    fixAttemptsRef: React.MutableRefObject<number>
    assistantMessageId: string
    updateMessage: (
        id: string,
        updates: Partial<Message>
    ) => void
}

export async function recoverFailedQuery({
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
    updateMessage
}: RecoverFailedQueryArgs) {

    await suggestFix({
        userQuery: query,
        schemas,
        relevantTables,
        relationships,
        signal,
        guard,
        error: errorMsg,
        assistantMessageId,
        updateMessage
    })

    if (fixAttemptsRef.current >= 2) {
        updateMessage(assistantMessageId, {
            error: "AI could not fix this query."
        })
        return null
    }
    fixAttemptsRef.current += 1

    const fixedSQL = await fixQueryWithAI({
        badQuery: baseQuery,
        errorMsg,
        schemas,
        relationships,
        signal,
        guard,
        assistantMessageId,
        updateMessage
    })
    if (!fixedSQL) {
        updateMessage(assistantMessageId, {
            error: "AI could not fix this query."
        })
        return null
    }
    return fixedSQL
}