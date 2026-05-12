type FixQueryArgs = {
    badQuery: string
    errorMsg: string
    schemas: Record<string, any[]>
    selectedTable: string | null
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
    runQuery: (sql?: string) => Promise<void>
    relationships: string[]
    signal?: AbortSignal
    guard?: () => boolean
}

export const fixQueryWithAI = async ({
    badQuery,
    errorMsg,
    schemas,
    selectedTable,
    setGeneratedSQL,
    runQuery,
    relationships,
    signal,
    guard
}: FixQueryArgs) => {
    try {
        if (signal?.aborted || !(guard?.() ?? true)) return

        const res = await fetch("/api/fix-sql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({
                query: badQuery,
                error: errorMsg,
                schemas,
                selectedTable,
                relationships
            })
        })
        const data = await res.json()
        if (signal?.aborted || !(guard?.() ?? true)) return

        console.log("FIXED SQL:", data.sql)
        setGeneratedSQL(data.sql)
        await runQuery(data.sql)
    } catch (err) {
        if (signal?.aborted) return
        console.error("Fix Failed:", err)
    }
}
