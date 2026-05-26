import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const { query, schemas, relationships, error } = await req.json()

    const schemaText = Object.entries(schemas)
        .map(([tableName, cols]) => {
            const colText = (cols as any[])
                .map((col: any) => col.column_name)
                .join(", ")
            return `${tableName} (${colText})`
        })
        .join("\n")

    const relationshipText = relationships
        .map((r: any) => `${r.fromTable}.${r.fromColumn} = ${r.toTable}.${r.toColumn}`)
        .join("\n")

    const prompt = `
You are an AI assistant helping users understand SQL query failures and empty results.

Your job:
- explain errors in simple human language
- explain why no rows may have matched
- suggest concise fixes
- NEVER generate SQL
- NEVER expose raw SQL engine internals

IMPORTANT:
- The SQL query executed successfully.
- There is NO syntax error.
- Your job is ONLY to help explain why no data matched.

STRICT RULES:
- NEVER generate SQL
- NEVER invent columns
- NEVER invent tables
- NEVER suggest columns not present in schema
- NEVER suggest JOINs
- NEVER rewrite the entire query
- ONLY use existing schema information

AVAILABLE TABLES AND COLUMNS:
${schemaText}

RELATIONSHIPS:
${relationshipText}

SAMPLE DATA:
${schemaText}

USER REQUEST:
"${query}"

SQL ERROR:
${error ?? "NONE"}

Your task:
- Suggest likely fixes based ONLY on existing columns and sample values
- Be concise
- Keep responses under 2 short sentences.
- Do not repeat the same idea multiple times.
- Do not mention multiple speculative causes unless strongly relevant.
- Mention if the requested value may not exist in dataset
- Explain the issue in user-friendly language
- Suggest likely fixes
- Keep response concise
- Never generate SQL

EXAMPLES:
"No matching rows were found for the requested values."

"The requested value may not exist in the uploaded dataset."

"Some filters may be too restrictive."

Return ONLY the suggestion text.
    `
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "user",
            content: prompt,
        }]
    })
    const suggestion = completion.choices[0]?.message?.content || ""
    return NextResponse.json({ suggestion })
}