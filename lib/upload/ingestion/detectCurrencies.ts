import { quoteIdentifier } from "@/lib/utils/sqlHelpers"
import { inferSemanticRole } from "@/lib/metadata/inferSemanticRole"
import { detectCurrencies, type CurrencyDetection } from "@/lib/metadata/detectCurrency"

type ColumnInfo = {
  column_name: string
  column_type: string
}

type QueryResultRow = Record<string, unknown>

type DuckConnection = {
  query: (sql: string) => Promise<{
    toArray: () => QueryResultRow[]
  }>
}

const SAMPLE_LIMIT = 500

export const detectCurrenciesInTable = async (
  conn: DuckConnection,
  tableName: string,
  columns: ColumnInfo[],
): Promise<Record<string, CurrencyDetection>> => {
  const currencyLike = columns.filter(
    (col) => inferSemanticRole(col.column_name, col.column_type) === "currency",
  )

  if (currencyLike.length === 0) return {}

  const result: Record<string, CurrencyDetection> = {}

  for (const col of currencyLike) {
    try {
      const sample = await conn.query(`
        SELECT
          CAST(${quoteIdentifier(col.column_name)} AS VARCHAR) AS value
        FROM ${quoteIdentifier(tableName)}
        WHERE ${quoteIdentifier(col.column_name)} IS NOT NULL
        LIMIT ${SAMPLE_LIMIT}
      `)

      const values = sample.toArray().map((row) => row.value)
      result[col.column_name] = detectCurrencies(values)
    } catch (err) {
      console.error(
        `Currency detection failed for "${tableName}.${col.column_name}".`,
        err,
      )
      result[col.column_name] = {
        currency: null,
        currencies: [],
        mixedCurrency: false,
      }
    }
  }

  return result
}