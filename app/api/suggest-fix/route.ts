import { suggestFixPrompt } from "@/lib/ai/prompts/suggest-fix-prompt"
import { checkRateLimit } from "@/lib/security/checkRateLimit"
import { isPayloadTooLarge } from "@/lib/api/validateRequestSize"
import { groq } from "@/lib/ai/client";
import { DEBUG } from "@/lib/config/debug";
import { NextResponse } from "next/server"

export async function POST(req: Request) {

    const limited = checkRateLimit(req, "suggest-fix", 5, 60000, "Too many AI fix attempts.")
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

    if (isPayloadTooLarge(body)) {
        return NextResponse.json(
            { error: "Request payload too large" },
            { status: 413 }
        )
    }

    const { query, schemas, relationships, error } = body

    const prompt = suggestFixPrompt({
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