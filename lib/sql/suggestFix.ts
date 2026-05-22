import { error } from "console"

type SuggestFixArgs = {
    userQuery: string
    schemas: Record<string, any[]>
    selectedTable: string | null
    setError: (val: string | null) => void
    relationships: string[]
    signal?: AbortSignal
    guard?: () => boolean
    error?: string
}

export const suggestFix = async ({
    userQuery,
    schemas,
    selectedTable,
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
                selectedTable,
                relationships,
                error
            })
        })
        const data = await res.json()
        if (signal?.aborted || !(guard?.() ?? true)) return

        console.log("Suggestion:", data.suggestion)
        setError(data.suggestion)

    } catch (err) {
        if (signal?.aborted) return
        console.error("Suggestion failed:", err)
    }
}
