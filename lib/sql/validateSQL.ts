import { getDuckDB } from "@/lib/duckdb"

type ValidateSQLArgs = {
    sql: string
}

export const validateSQL = async ({
    sql,
}: ValidateSQLArgs): Promise<string | null> => {

    if (!sql || typeof sql !== "string") {
        return "AI failed to generate valid SQL."
    }
    const lowerSQL = sql.toLowerCase()

    // Block dangerous keywords:
    const blockKeywords = [
        "drop",
        "delete",
        "update",
        "truncate",
        "insert",
        "alter",
        "create"
    ]
    for (const keyword of blockKeywords) {
        if (lowerSQL.includes(keyword)) {
            return `Dangerous SQL detected: ${keyword.toUpperCase()}`
        }
    }

    // DuckDB parser validation:
    const db = await getDuckDB()
    const conn = await db.connect()

    try {
        await conn.query(`EXPLAIN ${sql}`)
        return null
    } catch (err) {
        return String(err)
    } finally {
        await conn.close()
    }
}