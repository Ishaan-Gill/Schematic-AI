import { getDuckConnection } from "@/lib/duckdb/duckdb"
import { ensureWorkspaceFresh } from "@/lib/duckdb/ensureWorkspaceFresh"
import { cleanSql } from "@/lib/sql/cleanSql"

export async function fetchAllRows(
    sql: string,
): Promise<Record<string, unknown>[]> {
    const cleanSQL = cleanSql(sql)

    const conn = await getDuckConnection()
    await ensureWorkspaceFresh(conn)

    const reader = await conn.send(cleanSQL)

    const rows: Record<string, unknown>[] = []
    for await (const batch of reader) {
        const batchRows = batch.toArray()
        for (let i = 0; i < batchRows.length; i++) {
            rows.push({ ...batchRows[i] } as Record<string, unknown>)
        }
    }

    return rows
}
