import type { Relationship } from "../ai/relationships"

type SuggestFixArgs = {
    userQuery: string
    schemas: Record<string, any[]>
    relevantTables?: string[]
    setError: (val: string | null) => void
    relationships: Relationship[]
    signal?: AbortSignal
    guard?: () => boolean
    error?: string
}

export const suggestFix = async ({
    userQuery,
    schemas,
    relevantTables,
    setError,
    relationships,
    signal,
    guard,
    error
}: SuggestFixArgs) => {
    try {
        if (signal?.aborted || !(guard?.() ?? true)) return

        const res = await fetch("/api/suggest-fix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({
                query: userQuery,
                schemas,
                relevantTables,
                relationships,
                error
            })
        })
        const data = await res.json()
        if (signal?.aborted || !(guard?.() ?? true)) return

        if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("Suggestion:", data.suggestion)

        setError(data.suggestion)
    } catch (err) {
        if (signal?.aborted) return
        console.error("Suggestion failed:", err)
    }
}
