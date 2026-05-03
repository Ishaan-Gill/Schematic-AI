import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const body = await req.json()
    const { query, schema, selectedTable, sampleText } = body
    console.log("BODY:", body)

    if(!selectedTable || !query || !schema) {
        return NextResponse.json(
            {error: "Missing required fields (query, schema or selectedTable)"},
            {status: 400}
        )
    }

    // convert schema to readable text
    const schemaText = schema
        .map((col: any) => `${col.column_name} (${col.column_type})`)
        .join(", ")

    const prompt = `
You are a STRICT SQL generator.

RULES (VERY IMPORTANT):
- Use ONLY the given table: ${selectedTable}
- Use ONLY columns from the schema
- NEVER invent columns
- NEVER guess column names
- If the request cannot be answered using schema, return: INVALID_QUERY
- All string comparisons MUST use LOWER(column) = LOWER('value')
- Add LIMIT 10 if not specified
- Return ONLY SQL (no explanation, no markdown)

VALUE CORRECTION RULE:
- If user provides a value that is similar to sample data (typo, casing, small variation),
  you MUST replace it with the closest matching value from sample rows.
- Example: "chicagooo" → "Chicago"

Schema:
${schemaText}

Sample rows:
${sampleText}

User request:
"${query}"

Generate SQL:
`

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt,
                }
            ]
        })

        const raw = completion.choices[0]?.message?.content || ""
        console.log("AI RAW:", raw)

        const cleanedSQL = raw
        .replace(/```sql|```/g, "")
        .trim()
        

        return NextResponse.json({sql: cleanedSQL})
    } catch (err) {
        console.error("Groq Error:", err)
        return NextResponse.json(
            {error: String(err)},
            {status: 500}
        )
    }
}