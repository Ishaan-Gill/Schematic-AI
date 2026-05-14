import type { ColumnProfile } from "../metadata/profileMemory"

type ColumnInfo = {
    column_name: string
}

type QueryResultRow = Record<string, unknown>

type DuckConnection = {
    query: (sql: string) => Promise<{
        toArray: () => QueryResultRow[]
    }>
}

type ProfileTableArgs = {
    conn: DuckConnection
    tableName: string
    columns: ColumnInfo[]
}

export const profileTable = async ({
    conn,
    tableName,
    columns,
}: ProfileTableArgs): Promise<Record<string, ColumnProfile>> => {

    const profile: Record<string, ColumnProfile> = {}

    for (const col of columns) {
        const columnName = col.column_name

        try {
            const stats = await conn.query(`
                SELECT
                    COUNT(*) AS total_rows,
                    COUNT("${columnName}") AS non_null_rows,
                    COUNT(DISTINCT "${columnName}") AS unique_values
                FROM "${tableName}"
            `)

            const row = stats.toArray()[0]

            const totalRows = Number(row?.total_rows ?? 0)
            const nonNullRows = Number(row?.non_null_rows ?? 0)

            profile[columnName] = {
                totalRows,
                nonNullRows,
                uniqueValues: Number(row?.unique_values ?? 0),

                nullPercentage:
                    totalRows === 0
                        ? 0
                        : ((totalRows - nonNullRows) / totalRows) * 100,
            }

        } catch {
            console.error("Profiling failed:", columnName)
        }
    }

    return profile
}