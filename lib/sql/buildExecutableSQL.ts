import { cleanSql } from "./cleanSql"

type BuildExecutableSQLArgs = {
    sql: string
    page: number
    PAGE_SIZE: number
}

export function buildExecutableSQL({
    sql,
    page,
    PAGE_SIZE=100,
}: BuildExecutableSQLArgs) {
    const baseQuery = cleanSql(sql)

    // Queries that should NOT be paginated (describe, show)
    const isNonPaginated = /^(describe|show)\b/i.test(baseQuery.trim())

    // Pagination
    const finalQuery = isNonPaginated
        ? baseQuery
        : `
        SELECT *
        FROM (
            ${baseQuery}
            ) AS paginated_query
            LIMIT ${PAGE_SIZE + 1}
            OFFSET ${page * PAGE_SIZE}
            `
    
    return{baseQuery, finalQuery}
}