type SuggestFixArgs = {
    userQuery: string
    schemas: Record<string, any[]>
    selectedTable: string | null
    setError: (val: string | null) => void
    relationships: string[]
}

export const suggestFix = async ({
    userQuery,
    schemas,
    selectedTable,
    setError,
    relationships
}: SuggestFixArgs) => {
    try {
        const res = await fetch("/api/suggest-fix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: userQuery,
                schemas,
                selectedTable,
                relationships
            })
        })
        const data = await res.json()
        console.log("Suggestion:", data.suggestion)
        setError(`No results found. ${data.suggestion}`)
    } catch (err) {
        console.error("Suggestion failed:", err)
    }
}
