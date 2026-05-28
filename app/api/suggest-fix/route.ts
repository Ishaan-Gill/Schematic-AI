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
            { error: "Invalid request body" },
            { status: 400 }
        )
    }
    const { query, schemas, relationships, error } = body

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
                    },
                    {
                        role: "user",
                        content: `
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
    const suggestion = completion.choices[0]?.message?.content || ""
    return NextResponse.json({ suggestion })
}