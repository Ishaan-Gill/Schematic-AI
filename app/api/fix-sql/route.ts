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
You are a SQL debugger.

Fix the SQL query based on the error.

IMPORTANT:
- Use ONLY this table: ${selectedTable}
- Use ONLY columns from schema
- Return ONLY fixed SQL

Schema:
${schemaText}

Broken Query:
${query}

Error:
${error}

Return corrected SQL.
    `
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "user",
            content: prompt,
        }]
    })
    const raw = completion.choices[0]?.message?.content || ""
    const cleanedSQL = raw.replace(/```sql|```/g, "").trim()
    return NextResponse.json({sql: cleanedSQL})
}