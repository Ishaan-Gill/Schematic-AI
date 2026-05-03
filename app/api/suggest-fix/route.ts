import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const { query, error, schema, selectedTable} = await req.json()

    const schemaText = schema
        .map((col: any) => `${col.column_name} (${col.column_type})`)
        .join(", ")
    
    const prompt = `
User query returned no results.

Based on schema and common sense, suggest a correction.

IMPORTANT:
- Be short
- Suggest likely correct value (like fixing typos)
- Do NOT return SQL

Table: ${selectedTable}

Schema:
${schemaText}

User query:
"${query}"

Give a helpful suggestion.
    `
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "user",
            content: prompt,
        }]
    })
    const suggestion = completion.choices[0]?.message?.content || ""
    return NextResponse.json({suggestion})
}