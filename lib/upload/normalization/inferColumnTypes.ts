import { quoteIdentifier } from "@/lib/utils/quoteIdentifier"

type ColumnInfo = {
    column_name: string
    column_type: string
}

type QueryResultRow = Record<string, unknown>

type DuckConnection = {
    query: (sql: string) => Promise<{ toArray: () => QueryResultRow[] }>
}

export const inferColumnTypes = async (
    conn: DuckConnection,
    tableName: string
) => {
    const schemaResult = await conn.query(`DESCRIBE ${quoteIdentifier(tableName)}`)
    const columns = schemaResult.toArray() as ColumnInfo[]

    for (const col of columns) {
        if (col.column_type !== "VARCHAR") {
            continue
        }

        const columnName = col.column_name
        const numericCheck = await conn.query(`
            SELECT
                COUNT(CASE WHEN ${quoteIdentifier(columnName)} IS NOT NULL THEN 1 END) AS total_rows,
                COUNT(
                    TRY_CAST(
                        REPLACE(REPLACE(REPLACE(${quoteIdentifier(columnName)}, '$', ''), ',', ''), '%', '') AS DOUBLE
                    )
                ) AS numeric_rows
            FROM ${quoteIdentifier(tableName)}
        `)

        const stats = numericCheck.toArray()[0] ?? {}
        const totalRows = Number(stats.total_rows ?? 0)
        const numericRows = Number(stats.numeric_rows ?? 0)
        const ratio = totalRows === 0 ? 0 : numericRows / totalRows

        if (ratio > 0.8) {
            await conn.query(`
                ALTER TABLE ${quoteIdentifier(tableName)}
                ALTER COLUMN ${quoteIdentifier(columnName)}
                TYPE DOUBLE
                USING TRY_CAST(
                    REPLACE(REPLACE(REPLACE(${quoteIdentifier(columnName)}, '$', ''), ',', ''), '%', '') AS DOUBLE
                )
            `)
        }
    }

    const updatedSchemaResult = await conn.query(`DESCRIBE ${quoteIdentifier(tableName)}`)
    const updatedSchemaColumns = updatedSchemaResult.toArray() as ColumnInfo[]

    for (const col of updatedSchemaColumns) {
        if (col.column_type !== "VARCHAR" && col.column_type !== "TEXT") {
            continue
        }

        const columnName = col.column_name
        const dateCheck = await conn.query(`
            SELECT
                COUNT(*) AS total_rows,
                COUNT(
                    COALESCE(
                        TRY_STRPTIME(${quoteIdentifier(columnName)}, '%Y-%m-%d'),
                        TRY_STRPTIME(${quoteIdentifier(columnName)}, '%m/%d/%Y'),
                        TRY_STRPTIME(${quoteIdentifier(columnName)}, '%B %d %Y'),
                        TRY_CAST(${quoteIdentifier(columnName)} AS DATE)
                    )
                ) AS date_rows
            FROM ${quoteIdentifier(tableName)}
        `)

        const dateStats = dateCheck.toArray()[0] ?? {}
        const totalRows = Number(dateStats.total_rows ?? 0)
        const dateRows = Number(dateStats.date_rows ?? 0)
        const dateRatio = totalRows === 0 ? 0 : dateRows / totalRows

        if (dateRatio > 0.8) {
            await conn.query(`
                ALTER TABLE ${quoteIdentifier(tableName)}
                ALTER COLUMN ${quoteIdentifier(columnName)}
                TYPE DATE
                USING COALESCE(
                    TRY_STRPTIME(${quoteIdentifier(columnName)}, '%Y-%m-%d'),
                    TRY_STRPTIME(${quoteIdentifier(columnName)}, '%m/%d/%Y'),
                    TRY_STRPTIME(${quoteIdentifier(columnName)}, '%B %d %Y'),
                    TRY_CAST(${quoteIdentifier(columnName)} AS DATE)
                )
            `)
        }
    }
}
