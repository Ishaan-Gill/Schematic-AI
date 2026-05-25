import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const { query, lastSQL, schemas, relationships } = await req.json()

    const schemaText = Object.entries(schemas)
        .map(([tableName, cols]) => {
            const colText = (cols as any[])
                .map((col: any) => col.column_name)
                .join(", ")
            return `${tableName} (${colText})`
        })
        .join("\n")

    const prompt = `
You are an expert SQL editor.

You will either:
1. Generate a NEW query
2. MODIFY an existing query (for follow-ups)

----------------------------

RULES:

- Use ONLY tables and columns from schema
- NEVER invent names
- Preserve correct SQL structure
- Return ONLY SQL

----------------------------

IF isFollowUp = true:

- MODIFY the previous SQL
- DO NOT rewrite from scratch
- Keep existing SELECT, JOIN, GROUP BY
- Only ADD or UPDATE conditions

Examples:
- "only from chicago" → add WHERE condition
- "only electronics" → add JOIN + filter if needed
- "last month" → add date filter

----------------------------

Schema:
${schemaText}

Relationships:
${relationships}

Previous SQL:
${lastSQL}

User request:
"${query}"

Return SQL:
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

        const sql = cleanedSQL.trim()

        if (!sql.toLowerCase().startsWith("select") && !sql.toLowerCase().startsWith("with") && !sql.toLowerCase().startsWith("describe")) {
            return NextResponse.json({
                error: "Something went wrong generating your query. Please try again."
            })
        }

        // to block invalid SQL before it enters fix-sql (which breaks the sql more)
        const validTables = Object.keys(schemas)
        const usedTables = cleanedSQL.match(/from\s+(\w+)|join\s+(\w+)/gi) || []
        const extractedTables = usedTables.map(match => match.split(" ")[1])
        const hasInvalidTable = extractedTables.some(
            (t) => !validTables.includes(t)
        )
        if (hasInvalidTable) {
            return NextResponse.json({
                error: "INVALID_TABLE_USED"
            })
        }

        return NextResponse.json({ sql: cleanedSQL })
    } catch (err) {
        console.error("Groq Error:", err)
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        )
    }

}