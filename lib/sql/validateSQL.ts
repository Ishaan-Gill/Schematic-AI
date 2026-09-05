import { getDuckConnection } from "@/lib/duckdb/duckdb"
import { ensureWorkspaceFresh } from "@/lib/duckdb/ensureWorkspaceFresh"
import { checkSQLSafetySync } from "@/lib/sql/sqlSafety"
import { ExplainTimeoutError, explainWithTimeout } from "@/lib/sql/explainWithTimeout"

type ValidateSQLArgs = {
    sql: string
}

export const validateSQL = async ({
    sql,
}: ValidateSQLArgs): Promise<string | null> => {

    if (!sql || typeof sql !== "string") {
        return "Something went wrong. Please try again."
    }

    const safetyError = checkSQLSafetySync(sql)
    if (safetyError) {
        return safetyError
    }
    
    try {
        // DuckDB parser validation:
        const conn = await getDuckConnection()

        await ensureWorkspaceFresh(conn)

        await explainWithTimeout(conn, sql)

        return null
    } catch (err) {
        if (err instanceof ExplainTimeoutError) {
            return "Query validation timed out — please try again."
        }
        const raw = String(err)
        console.error("SQL validation failed:", err)

        if (raw.includes("Parser Error")) return "SQL syntax error — the AI generated an invalid query. Try rephrasing."
        if (raw.includes("Table") && raw.includes("not found")) return "Query references a table that isn't loaded."
        if (raw.includes("Column") && raw.includes("not found")) return "Query references a column that doesn't exist."
        return "Query validation failed — please try again."
    } 
}