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
        const { query, error, schemas, selectedTable, relationships } = await req.json()

        if (!query || !error || !schemas || !selectedTable) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const schemaText = Object.entries(schemas)
            .map(([tableName, cols]) => {
                const colText = (cols as any[])
                    .map((col: any) =>
                        `${col.column_name} (${col.column_type})`
                    )
                    .join(", ")

                return `${tableName}: ${colText}`
            })
            .join("\n\n")

        const prompt = `
You are a SQL repair engine.

Your ONLY job:
- repair invalid SQL
- preserve original intent
- NEVER invent columns
- NEVER invent tables
- ONLY use provided schema
- Return ONLY executable SQL

Relationships:
${relationships.join("\n")}

Tables:
${schemaText}

Broken SQL:
${query}

Database Error:
${error}
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
            { error: "Failed to fix SQL" },
            { status: 500 }
        )
    }
}