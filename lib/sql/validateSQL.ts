import { getDuckDB } from "@/lib/duckdb"

type ValidateSQLArgs = {
    sql: string
}

export const validateSQL = async ({
    sql,
}: ValidateSQLArgs): Promise<string | null> => {

    if (!sql || typeof sql !== "string") {
        return "Something went wrong. Please try again."
    }

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
        const pattern = new RegExp(`\\b${keyword}\\b`, "i")
        if (pattern.test(sql)) {
            return `Dangerous SQL detected: ${keyword.toUpperCase()}`
        }
    }

    const trimmed = sql.trim().toLowerCase()
    if (!trimmed.startsWith("select") && !trimmed.startsWith("with") && !trimmed.startsWith("describe")) {
        return "Only SELECT queries are allowed."
    }

    // DuckDB parser validation:
    const db = await getDuckDB()
    const conn = await db.connect()

    try {
        await conn.query(`EXPLAIN ${sql}`)
        return null
    } catch (err) {
        const raw = String(err)
        console.error("SQL validation failed:", err)

        if (raw.includes("Parser Error")) return "SQL syntax error — the AI generated an invalid query. Try rephrasing."
        if (raw.includes("Table") && raw.includes("not found")) return "Query references a table that isn't loaded."
        if (raw.includes("Column") && raw.includes("not found")) return "Query references a column that doesn't exist."
        return "Query validation failed — please try again."
    } finally {
        await conn.close()
    }
}