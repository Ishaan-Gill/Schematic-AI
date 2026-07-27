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
    if (!data.sql) return "Something went wrong. Please try again."
    if (data.sql.trim().toUpperCase() === "INVALID_QUERY" || sql.trim().toUpperCase() === "INVALID_QUERY") {
        return "I couldn't find an answer to this in your uploaded data. Try rephrasing, or check if the relevant dataset is uploaded."
    }
    if (data.error === "INVALID_TABLE_USED") {
        return "AI used a table that doesn't exist. Try again."
    }
    if (error?.includes("does not have a column") || error?.includes("does not exist")) {
        return "AI used invalid column/table. Try rephrasing."
    }
    if (!sql.startsWith("select") && !sql.startsWith("with") && !sql.startsWith("describe")
    ) {
        return "Something went wrong generating your query. Please try again."
    }
    if (!sql.toLowerCase().includes("select")) return "Something went wrong generating your query. Please try again."

    return null
}
