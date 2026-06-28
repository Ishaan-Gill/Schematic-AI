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
    setError: (val: string | null) => void
    signal?: AbortSignal
    guard?: () => boolean
    fixAttemptsRef: React.MutableRefObject<number>
}

export async function recoverFailedQuery({
    query,
    baseQuery,
    errorMsg,
    schemas,
    relevantTables,
    relationships,
    setError,
    signal,
    guard,
    fixAttemptsRef,
}: RecoverFailedQueryArgs) {

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
        return null
    }
    fixAttemptsRef.current += 1

    const fixedSQL = await fixQueryWithAI({
        badQuery: baseQuery,
        errorMsg,
        schemas,
        relationships,
        setError,
        signal,
        guard,
    })
    if (!fixedSQL) {
        setError("AI could not fix this query.")
        return null
    }
    return fixedSQL
}