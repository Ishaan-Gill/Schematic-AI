import { quoteIdentifier } from "@/lib/utils/sqlHelpers"

type ColumnInfo = {
    column_name: string
}

type DuckConnection = {
    query: (sql: string) => Promise<unknown>
}

type CleanValuesArgs = {
    conn: DuckConnection
    tableName: string
    columns: ColumnInfo[]
}

export const cleanValues = async ({
    conn,
    tableName,
    columns,
}: CleanValuesArgs) => {
    for (const col of columns) {
        const columnName = col.column_name

        await conn.query(`
            UPDATE ${quoteIdentifier(tableName)}
            SET ${quoteIdentifier(columnName)} = NULL
            WHERE TRIM(LOWER(CAST(${quoteIdentifier(columnName)} AS VARCHAR))) IN (
                'n/a',
                'na',
                'null',
                'none',
                '-',
                '--',
                ''
            )
        `).catch(() => undefined)
    }
}
