import { checkRateLimit } from "@/lib/security/checkRateLimit"
import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {

    const limited = checkRateLimit(req, 5, 60000, "Too many AI fix attempts.")
    if (limited) return limited

    let body
    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { error: "invalid request body" },
            { status: 400 }
        )
    }
    const { query, lastSQL, schemas, relationships } = body

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

    let completion
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                messages: [
                    {
                        role: "system",
                        content: `
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

                            Return SQL:
                            `
                    },
                    {
                        role: "user",
                        content: `
                            Schema:
                            ${schemaText}
    
                            Relationships:
                            ${relationshipText}
        
                            Previous SQL:
                            ${lastSQL}
        
                            User request:
                            "${query}"
                        `
                    }
                ]
            })
            break

        } catch (err) {
            const DEBUG = process.env.NODE_ENV === "development"
            if (DEBUG) {
                console.error(`Groq attempt (edit-sql) ${attempt} failed: `, err)
            }

            // Small delay before retry:
            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }
    }

    if (!completion) {
        return NextResponse.json(
            { error: "AI generation failed. Please try again." },
            { status: 500 }
        )
    }

    const raw = completion.choices[0]?.message?.content || ""

    const DEBUG = process.env.NODE_ENV === "development"
    if (DEBUG) {
        console.log("AI RAW:", raw)
    }
    const cleanedSQL = raw
        .replace(/```sql | ```/g, "")
        .trim()

    const sql = cleanedSQL.trim()

    if (!sql.toLowerCase().startsWith("select") && !sql.toLowerCase().startsWith("with") && !sql.toLowerCase().startsWith("describe")) {
        return NextResponse.json(
            { error: "Something went wrong generating your query. Please try again." },
            { status: 502 }
        )
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
}