type ValidateSQLArgs = {
    sql: string
    schemas: Record<string, any[]>
}

export const validateSQL = ({
    sql,
    schemas
}: ValidateSQLArgs): string | null => {
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

    // Validate table names:
    const validTables = Object.keys(schemas)

    const tableMatches = lowerSQL.match(/from\s+([a-zA-Z0-9_]+)/g) || []
    const joinMatches = lowerSQL.match(/join\s+([a-zA-Z0-9_]+)/g) || []
    const usedTables = [
        ...tableMatches,
        ...joinMatches
    ].map(match => match.replace("from", "").replace("join", "").trim())

    for (const table of usedTables) {
        if (!validTables.includes(table)) {
            return `Invalid table used: ${table}`
        }
    }

    // Validate Columns of tables:
    const validColumns = Object.values(schemas)
        .flat()
        .map((col: any) =>
            col.column_name.toLowerCase()
        )

    const words = lowerSQL.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []

    const aliasMatches = lowerSQL.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []
    const aliases = aliasMatches.map(match => match.replace("as", "").trim())

    const ignoredWords = [
        "select",
        "from",
        "where",
        "join",
        "inner",
        "left",
        "right",
        "on",
        "group",
        "by",
        "order",
        "limit",
        "sum",
        "count",
        "avg",
        "min",
        "max",
        "as",
        "desc",
        "asc",
        "and",
        "or",
        "with",
        "row_number",
        "over",
        "partition",
        "current_date",
        "interval",
        "month",
        "day",
        "days",
        "year",
        "years",
        "week",
        "weeks",
        "extract",
        "date",
        "cast",
        "timestamp",
        "distinct"
    ]
    const suspiciousWords = words.filter(word => {
        return (
            !ignoredWords.includes(word) &&
            !validColumns.includes(word) &&
            !validTables.includes(word) &&
            !aliases.includes(word) &&
            isNaN(Number(word))
        )
    })
    if (suspiciousWords.length > 0) {
        return `Unknown columns detected: ${suspiciousWords.join(", ")}`
    }
    return null
}