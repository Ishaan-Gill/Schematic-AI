type ValidationArgs = {
    data: { sql?: string; error?: string }
    sql: string
    error?: string | null
}

export const getSQLValidationError = ({
    data,
    sql,
    error
}: ValidationArgs) => {
    if (!data.sql) return "AI failed to generate SQL"
    if (data.sql === "INVALID_QUERY" || sql === "INVALID_QUERY") {
        return "Cannot answer with available data."
    }
    if (data.error === "INVALID_TABLE_USED") {
        return "AI used a table that doesn't exist. Try again."
    }
    if (error?.includes("does not have a column") || error?.includes("does not exist")) {
        return "AI used invalid column/table. Try rephrasing."
    }
    if (!sql.startsWith("select") && !sql.startsWith("with") && !sql.startsWith("describe")
    ) {
        return "Invalid SQL generated."
    }
    if (!sql.toLowerCase().includes("select")) return "Invalid SQL generated"

    return null
}
