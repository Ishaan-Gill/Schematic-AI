import { ExplainSQLPrompt } from "@/lib/ai/prompts/explain-sql-prompt"
import { groq } from "@/lib/ai/client"
import { DEBUG } from "@/lib/config/debug"

type ExplainSQLParams = {
  query: string
  sql: string
  result: Record<string, unknown>[]
  schemas: Record<string, any[]>
  relevantTables: string[]
  relationships: any[]
  finalDatasetContext: Record<string, any>
}

export async function explainSQL({
  query,
  sql,
  result,
  schemas,
  relevantTables,
  relationships,
  finalDatasetContext,
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
        .map((col: any) => `${col.column_name} (${col.column_type})`)
        .join(", ")
      return `${tableName}: ${colText}`
    })
    .join("\n\n")

  const filteredRelationships = relationships.filter(
    (r: any) =>
      finalRelevantTables?.includes(r.fromTable) &&
      finalRelevantTables?.includes(r.toTable),
  )

  const resultSummary = {
    rowCount: result.length,
    columns: result.length > 0 ? Object.keys(result[0]) : [],
  }

  const prompt = ExplainSQLPrompt({
    schemaText,
    sql,
    resultSummary,
    filteredRelationships,
    safeDatasetContext,
    query,
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
      if (DEBUG) {
        console.error(`Groq attempt (explain-sql) ${attempt} failed:`, err)
      }

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
