import { quoteIdentifier } from "@/lib/utils/sqlHelpers"
import type { DuckConnection } from "@/types/duckdb"

type ColumnInfo = {
    column_name: string
    column_type: string
}

export type CoercionWarning = {
    column: string
    targetType: "DOUBLE" | "DATE"
    totalRows: number
    failedRows: number
}

export const inferColumnTypes = async (
    conn: DuckConnection,
    tableName: string
): Promise<CoercionWarning[]> => {
    const schemaResult = await conn.query(`DESCRIBE ${quoteIdentifier(tableName)}`)
    const columns = schemaResult.toArray() as ColumnInfo[]

    const coercionWarnings: CoercionWarning[] = []

    for (const col of columns) {
        if (col.column_type !== "VARCHAR") {
            continue
        }

        const columnName = col.column_name
        const quotedColumn = quoteIdentifier(columnName)

        // Strip $ , % — correct for US thousands separators and plain numbers
        const usNumericExpr = `REPLACE(REPLACE(REPLACE(${quotedColumn}, '$', ''), ',', ''), '%', '')`
        // EU format: strip $ %, drop '.' thousands, convert ',' decimal to '.'
        const euNumericExpr = `REPLACE(REPLACE(REPLACE(REPLACE(${quotedColumn}, '$', ''), '%', ''), '.', ''), ',', '.')`

        // Percent-suffixed rows are stored as fractions (45% -> 0.45), per-row
        // so columns mixing "45%" and bare "45" stay internally consistent
        const usCastExpr = `CASE WHEN contains(${quotedColumn}, '%')
            THEN TRY_CAST(${usNumericExpr} AS DOUBLE) / 100.0
            ELSE TRY_CAST(${usNumericExpr} AS DOUBLE) END`
        const euCastExpr = `CASE WHEN contains(${quotedColumn}, '%')
            THEN TRY_CAST(${euNumericExpr} AS DOUBLE) / 100.0
            ELSE TRY_CAST(${euNumericExpr} AS DOUBLE) END`

        const numericCheck = await conn.query(`
            SELECT
                COUNT(CASE WHEN ${quotedColumn} IS NOT NULL THEN 1 END) AS total_rows,
                COUNT(
                    CASE
                        WHEN ${quotedColumn} IS NOT NULL
                         AND ${usCastExpr} IS NOT NULL
                        THEN 1
                    END
                ) AS us_plain_rows,
                COUNT(
                    CASE WHEN regexp_full_match(
                        TRIM(${quotedColumn}),
                        '[+-]?[0-9]{1,3}(\\.[0-9]{3})+,[0-9]+'
                    ) = true
                    AND ${euCastExpr} IS NOT NULL THEN 1 END
                ) AS eu_rows
            FROM ${quoteIdentifier(tableName)}
        `)

        const stats = numericCheck.toArray()[0] ?? {}
        const totalRows = Number(stats.total_rows ?? 0)
        const usPlainRows = Number(stats.us_plain_rows ?? 0)
        const euRows = Number(stats.eu_rows ?? 0)
        const ratio = totalRows === 0 ? 0 : usPlainRows / totalRows
        const euRatio = totalRows === 0 ? 0 : euRows / totalRows

        if (euRatio > 0.8) {
            await conn.query(`
                ALTER TABLE ${quoteIdentifier(tableName)}
                ALTER COLUMN ${quotedColumn}
                TYPE DOUBLE
                USING ${euCastExpr}
            `)
            if (totalRows > euRows) {
                coercionWarnings.push({
                    column: columnName,
                    targetType: "DOUBLE",
                    totalRows,
                    failedRows: totalRows - euRows,
                })
            }
        } else if (ratio > 0.8 && euRows === 0) {
            await conn.query(`
                ALTER TABLE ${quoteIdentifier(tableName)}
                ALTER COLUMN ${quotedColumn}
                TYPE DOUBLE
                USING ${usCastExpr}
            `)
            if (totalRows > usPlainRows) {
                coercionWarnings.push({
                    column: columnName,
                    targetType: "DOUBLE",
                    totalRows,
                    failedRows: totalRows - usPlainRows,
                })
            }
        }
    }

    const updatedSchemaResult = await conn.query(`DESCRIBE ${quoteIdentifier(tableName)}`)
    const updatedSchemaColumns = updatedSchemaResult.toArray() as ColumnInfo[]

    for (const col of updatedSchemaColumns) {
        if (col.column_type !== "VARCHAR" && col.column_type !== "TEXT") {
            continue
        }

        const columnName = col.column_name
        const quotedColumn = quoteIdentifier(columnName)
        // Order matters: DuckDB strptime %Y also accepts 2-digit years
        // (e.g. '04/12/24' -> year 0024), so %y variants must run first.
        const dateParseExpr = `
            COALESCE(
                TRY_STRPTIME(${quotedColumn}, '%y-%m-%d'),
                TRY_STRPTIME(${quotedColumn}, '%Y-%m-%d'),
                TRY_STRPTIME(${quotedColumn}, '%Y-%m-%d %H:%M:%S'),
                TRY_STRPTIME(REPLACE(${quotedColumn}, 'T', ' '), '%Y-%m-%d %H:%M:%S'),
                TRY_STRPTIME(${quotedColumn}, '%m/%d/%y'),
                TRY_STRPTIME(${quotedColumn}, '%m/%d/%Y'),
                TRY_STRPTIME(${quotedColumn}, '%m/%d/%Y %H:%M:%S'),
                TRY_STRPTIME(${quotedColumn}, '%B %d %Y'),
                TRY_CAST(${quotedColumn} AS DATE),
                TRY_CAST(${quotedColumn} AS TIMESTAMPTZ)
            )
        `
        const dateCheck = await conn.query(`
            SELECT
                COUNT(*) AS total_rows,
                COUNT(
                    ${dateParseExpr}
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
                USING ${dateParseExpr}
            `)
            if (totalRows > dateRows) {
                coercionWarnings.push({
                    column: columnName,
                    targetType: "DATE",
                    totalRows,
                    failedRows: totalRows - dateRows,
                })
            }
        }
    }

    return coercionWarnings
}
