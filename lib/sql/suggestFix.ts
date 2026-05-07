type SuggestFixArgs = {
    userQuery: string
    schema: any[]
    schemas: Record<string, any[]>
    selectedTable: string | null
    setError: (val: string | null) => void
}

export const suggestFix = async ({
    userQuery,
    schema,
    selectedTable,
    setError
}: SuggestFixArgs) => {
    try {
        const res = await fetch("/api/suggest-fix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: userQuery,
                schema,
                selectedTable
            })
        })
        const data = await res.json()
        console.log("Suggestion:", data.suggestion)
        setError(`No results found. ${data.suggestion}`)
    } catch (err) {
        console.error("Suggestion failed:", err)
    }
}
