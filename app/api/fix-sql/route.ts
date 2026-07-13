import Groq from "groq-sdk"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/security/checkRateLimit"
import { fixSQLPrompt } from "@/lib/ai/prompts/fix-sql-prompt"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {

    const limited = checkRateLimit(req, "fix-sql", 5, 60000, "Too many AI fix attempts.")
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
    const { query, error, schemas, relationships } = body

    if (!query || !error || !schemas) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        )
    }

    const prompt = fixSQLPrompt({
        query,
        error,
        schemas,
        relationships
    })

    let completion
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                messages: [
                    {
                        role: "system",
                        content: prompt.system
                    },
                    {
                        role: "user",
                        content: prompt.user
                    }
                ]
            })
            break

        } catch (err) {
            const DEBUG = process.env.NODE_ENV === "development"
            if (DEBUG) {
                console.error(`Groq attempt (fix-sql) ${attempt} failed: `, err)
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
    const cleanedSQL = raw.replace(/```sql|```/g, "").trim()

    const blocked = ["drop", "delete", "update", "truncate", "insert", "alter", "create"]
    for (const keyword of blocked) {
        const pattern = new RegExp(`\\b${keyword}\\b`, "i")
        if (pattern.test(cleanedSQL)) {
            return NextResponse.json({ error: "Invalid SQL" }, { status: 400 })
        }
    }
    return NextResponse.json({ sql: cleanedSQL })

}