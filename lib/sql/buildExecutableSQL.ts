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

    const safePage = Number.isInteger(page) && page >= 0 ? page : 0
    const safePageSize =
        Number.isInteger(PAGE_SIZE) && PAGE_SIZE > 0 && PAGE_SIZE <= 1000
            ? PAGE_SIZE
            : 100

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
            LIMIT ${safePageSize + 1}
            OFFSET ${safePage * safePageSize}
            `
    
    return{baseQuery, finalQuery}
}