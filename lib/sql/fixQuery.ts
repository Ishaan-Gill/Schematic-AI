type FixQueryArgs = {
    badQuery: string
    errorMsg: string
    schemas: Record<string, any[]>
    selectedTable: string | null
    setGeneratedSQL: React.Dispatch<React.SetStateAction<string>>
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

        if (!data?.sql) {
            throw new Error("AI could not generate a fixed query.")
        }
        let fixedSQL = data.sql
        fixedSQL = fixedSQL
            .replace(/```sql/g, "")
            .replace(/```/g, "")
            .trim()

        const VALID_SQL_START =
            /^(SELECT|WITH|SHOW|DESCRIBE|PRAGMA|EXPLAIN)\s/i

        if (!VALID_SQL_START.test(fixedSQL)) {
            throw new Error("AI returned invalid SQL")
        }

        fixedSQL = fixedSQL.replace(/\bSTRPTIME\s*\(/gi, "TRY_STRPTIME(")

        if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("FIXED SQL:", fixedSQL)
        setGeneratedSQL(fixedSQL)
    } catch (err) {
        if (signal?.aborted) return
        console.error("Fix Failed:", err)
    }
}
