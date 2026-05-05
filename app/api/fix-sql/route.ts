import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

import { rateLimit } from "@/lib/rateLimiter"

export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "anonymous"

    if (!rateLimit(ip, 5, 60000)) {
        return NextResponse.json(
            { error: "Too many AI fix attempts. Please edit the SQL manually." },
            { status: 429 } // 429 is the standard code for "Too Many Requests"
        )
    }

    try {
        const { query, error, schema, selectedTable } = await req.json()

        if (!query || !error || !schema || !selectedTable) {
            return NextResponse.json(
                {error: "Missing required fields"},
                {status: 400}
            )
        }

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
        return NextResponse.json({ sql: cleanedSQL })
    } catch (err) {
        return NextResponse.json(
            {error: "Failed to fix SQL"},
            {status: 500}
        )
    }
}