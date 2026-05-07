type FixQueryArgs = {
    badQuery: string
    errorMsg: string
    schemas: Record<string, any[]>
    selectedTable: string | null
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
    runQuery: (sql?: string) => Promise<void>
    relationships: string[]
}

export const fixQueryWithAI = async ({
    badQuery,
    errorMsg,
    schemas,
    selectedTable,
    setGeneratedSQL,
    runQuery,
    relationships
}: FixQueryArgs) => {
    try {
        const res = await fetch("/api/fix-sql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: badQuery,
                error: errorMsg,
                schemas,
                selectedTable,
                relationships
            })
        })
        const data = await res.json()
        console.log("FIXED SQL:", data.sql)
        setGeneratedSQL(data.sql)
        await runQuery(data.sql)
    } catch (err) {
        console.error("Fix Failed:", err)
    }
}
