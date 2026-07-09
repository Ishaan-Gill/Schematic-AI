import { getDuckDB } from "@/lib/duckdb/duckdb"

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

    // Detect multiple statements — a semicolon followed by 
    // more non-whitespace content means multiple statements
    const trimmedStatement = trimmed.replace(/;\s*$/, "") // strip trailing semicolon only
    if (trimmedStatement.includes(";")) {
        return "Multiple SQL statements detected. Please ask one question at a time, or ask for a combined breakdown."
    }
    
    let conn: any = null
    try {
        // DuckDB parser validation:
        const db = await getDuckDB()
        conn = await db.connect()

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
        if (conn) await conn.close()
    }
}