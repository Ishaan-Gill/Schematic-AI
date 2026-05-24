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

    try {
        const selectClauses = columns.map(col => `
        COUNT("${col.column_name}") AS "${col.column_name}_non_null",
        COUNT(DISTINCT "${col.column_name}") AS "${col.column_name}_unique"
        `).join(",")

        const stats = await conn.query(`
        SELECT
            COUNT(*) AS total_rows,
            ${selectClauses}
        FROM "${tableName}"
        `)

        const row = stats.toArray()[0]
        const totalRows = Number(row.total_rows)

        for (const col of columns) {
            const nonNullRows = Number(
                row[`${col.column_name}_non_null`] ?? 0
            )
            profile[col.column_name] = {
                rowCount: totalRows,
                uniqueCount: Number(row[`${col.column_name}_unique`] ?? 0),
                nullCount: totalRows - nonNullRows,
                nullPercentage:
                    totalRows === 0
                        ? 0
                        : ((totalRows - nonNullRows) / totalRows) * 100
            }
        }
        return profile
    } catch (err) {
        console.error(
            "Profiling failed:",
            tableName,
            err
        )

        for (const col of columns) {
            profile[col.column_name] = {
                rowCount: 0,
                uniqueCount: 0,
                nullCount: 0,
                nullPercentage: 0
            }
        }
        return profile
    }
}