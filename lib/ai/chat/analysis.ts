import { ExplainSQLPrompt } from "@/lib/ai/prompts/explain-sql-prompt"
import { groq } from "@/lib/ai/client"
import { DEBUG } from "@/lib/config/debug"
import { quoteIdentifier } from "@/lib/utils/sqlHelpers"

type ExplainSQLParams = {
  query: string
  sql: string
  result: Record<string, unknown>[]
  schemas: Record<string, any[]>
  relevantTables: string[]
  relationships: any[]
  finalDatasetContext: Record<string, any>
  normalizationNotes?: string[]
  warnings?: string[]
}

const ROW_LIMIT = 50

export async function explainSQL({
  query,
  sql,
  result,
  schemas,
  relevantTables,
  relationships,
  finalDatasetContext,
  normalizationNotes = [],
  warnings = [],
}: ExplainSQLParams): Promise<string | null> {
  const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {}

  const finalRelevantTables =
    relevantTables?.length > 0 ? relevantTables : Object.keys(schemas)

  const filteredSchemas = Object.fromEntries(
    Object.entries(schemas).filter(([tableName]) =>
      finalRelevantTables?.includes(tableName),
    ),
  )

  const schemaText = Object.entries(filteredSchemas)
    .slice(0, 8)
    .map(([tableName, cols]) => {
      const colText = (cols as any[])
        .slice(0, 30)
        .map(
          (col: any) =>
            `${quoteIdentifier(col.column_name)} (${col.column_type})`,
        )
        .join(", ")
      return `${tableName}: ${colText}`
    })
    .join("\n\n")

  const filteredRelationships = relationships.filter(
    (r: any) =>
      finalRelevantTables?.includes(r.fromTable) &&
      finalRelevantTables?.includes(r.toTable),
  )

  const columns = result.length > 0 ? Object.keys(result[0]) : []
  const effectiveWarnings = [...warnings]

  if (result.length > ROW_LIMIT) {
    effectiveWarnings.push(
      `The result contains ${result.length} rows, but only the first ${ROW_LIMIT} rows were provided for analysis.`,
    )
  }

  const resultPayload = {
    query,
    sql,
    columns,
    rows: result.slice(0, ROW_LIMIT),
    rowCount: result.length,
    normalizationNotes,
    warnings: effectiveWarnings,
  }

  const prompt = ExplainSQLPrompt({
    schemaText,
    resultPayload,
    filteredRelationships,
    safeDatasetContext,
  })

  let completion
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: prompt.system,
          },
          {
            role: "user",
            content: prompt.user,
          },
        ],
      })
      break
    } catch (err) {
      console.error(`Groq attempt (explain-sql) ${attempt} failed:`, err)

      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  if (!completion) return null

  const explanation = completion.choices[0].message.content?.trim() || ""

  if (DEBUG) {
    console.log("AI RAW (explanation):", explanation)
  }

  return explanation
}
