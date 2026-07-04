import { Message } from "@/types/message"
import type { Relationship } from "../ai/context/relationships"

type SuggestFixArgs = {
    userQuery: string
    schemas: Record<string, any[]>
    relevantTables?: string[]
    relationships: Relationship[]
    signal?: AbortSignal
    guard?: () => boolean
    error?: string
    assistantMessageId: string
    updateMessage: (
        id: string,
        updates: Partial<Message>
    ) => void
}

export const suggestFix = async ({
    userQuery,
    schemas,
    relevantTables,
    relationships,
    signal,
    guard,
    error,
    assistantMessageId,
    updateMessage
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
                ...(error && { error }),
            })
        })
        const data = await res.json()
        if (signal?.aborted || !(guard?.() ?? true)) return

        if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("Suggestion:", data.suggestion)

        updateMessage(assistantMessageId, {
            error: data.suggestion
        })
    } catch (err) {
        if (signal?.aborted) return
        console.error("Suggestion failed:", err)
    }
}
