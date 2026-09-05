import { getDuckConnection, resetDuckConnection } from "@/lib/duckdb/duckdb"
import { ensureWorkspaceFresh } from "@/lib/duckdb/ensureWorkspaceFresh"
import { cleanSql } from "@/lib/sql/cleanSql"
import { validateSQL } from "@/lib/sql/validateSQL"

// Explicit bound so a valid query cannot exhaust browser memory.
// Normal paged queries return 100 rows; exports up to this limit succeed.
export const MAX_EXPORT_ROWS = 5000
const EXPORT_TIMEOUT_MS = 15000

export async function fetchAllRows(
    sql: string,
): Promise<Record<string, unknown>[]> {
    // Same safety invariant as normal execution: untrusted/generated SQL
    // must pass shared validation before reaching DuckDB.
    const validationError = await validateSQL({ sql })
    if (validationError) {
        throw new Error(validationError)
    }

    const cleanSQL = cleanSql(sql)

    const conn = await getDuckConnection()
    await ensureWorkspaceFresh(conn)

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error("Export timeout"))
        }, EXPORT_TIMEOUT_MS)
    })

    const collectPromise = (async (): Promise<Record<string, unknown>[]> => {
        const reader = await conn.send(cleanSQL)
        const rows: Record<string, unknown>[] = []
        for await (const batch of reader) {
            const batchRows = batch.toArray()
            for (let i = 0; i < batchRows.length; i++) {
                rows.push({ ...batchRows[i] } as Record<string, unknown>)
                if (rows.length > MAX_EXPORT_ROWS) {
                    throw new Error(
                        `Export is limited to ${MAX_EXPORT_ROWS.toLocaleString()} rows. Please refine your question to narrow the results.`,
                    )
                }
            }
        }
        return rows
    })()

    // Prevent an unhandled rejection if timeout wins the race.
    void collectPromise.catch(() => {})

    try {
        const rows = await Promise.race([collectPromise, timeoutPromise])
        return rows
    } catch (err) {
        if ((err as Error)?.message === "Export timeout") {
            try {
                const cancelled = await conn.cancelSent()
                if (!cancelled) {
                    await resetDuckConnection()
                }
            } catch {
                // cancel/reset is best-effort; original timeout error stands.
            }
            throw new Error("Export took too long. Please narrow your results and try again.")
        }
        throw err
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
    }
}
