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

    // Only allow SELECT/WITH:
    if (!lowerSQL.startsWith("select") && !lowerSQL.startsWith("with")) {
        return "Only SELECT queries are allowed."
    }

    // Block dangerous keywords:
    const blockKeywords = [
        "drop",
        "delete",
        "update",
        "truncate",
        "insert",
        "alrter",
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