import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const { query, schemas, selectedTable, relationships } = await req.json()

    const schemaText = Object.entries(schemas)
        .map(([tableName, cols]) => {
            const colText = (cols as any[])
                .map((col: any) => col.column_name)
                .join(", ")
            return `${tableName} (${colText})`
        })
        .join("\n")

    const prompt = `
You are an AI assistant helping users understand why a SQL query returned NO ROWS.

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
${relationships.join("\n")}

SAMPLE DATA:
${schemaText}

USER REQUEST:
"${query}"

Your task:
- Suggest possible reasons why zero rows were returned
- Suggest likely fixes based ONLY on existing columns and sample values
- Be concise
- Mention casing mismatches if relevant
- Mention possible missing values if relevant
- Mention if the requested value may not exist in dataset

GOOD EXAMPLES:

Example 1:
"No rows matched. Try using 'Chicago' instead of 'chicago'."

Example 2:
"No rows matched. The dataset may not contain customers from Chicago."

Example 3:
"No rows matched. Check whether the Category value exists in the uploaded data."

BAD EXAMPLES:
- SQL queries
- Invented columns
- Invented tables
- Technical SQL explanations

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