import { groq } from "@/lib/ai/client";
import { groqWithRetry } from "@/lib/ai/groqRetry";
import { NextResponse } from "next/server"
import { isPayloadTooLarge } from "@/lib/api/validateRequestSize"
import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest"
import { claimTurn } from "@/lib/api/claimTurn"
import { fixSQLPrompt } from "@/lib/ai/prompts/fix-sql-prompt"
import { checkSQLSafetySync } from "@/lib/sql/sqlSafety"
import { validateAgainstSchema } from "@/lib/sql/validateSchema"

type FixSqlBody = {
    userQuery?: unknown
    failedSql?: unknown
    error?: unknown
    rawError?: unknown
    schemas?: unknown
    relationships?: unknown
    currentDateHint?: unknown
    turnId?: unknown
}

export async function POST(req: Request) {
    let body: FixSqlBody | undefined
    try {
        body = (await req.json()) as FixSqlBody
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

    if (!body) {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        )
    }

    const { userQuery, failedSql, error, rawError, schemas, relationships, currentDateHint, turnId } = body

    const auth = await authorizeAIRequest(req, "fix-sql", 5, 60000, "Too many AI fix attempts.", {
        turnId: typeof turnId === "string" ? turnId : undefined,
    })
    if (!auth.authorized) return auth.response

    if (typeof turnId !== "string" || !turnId) {
        return NextResponse.json(
            { error: "Missing turn id" },
            { status: 400 }
        )
    }

    // Account this repair against the daily quota, exactly like /api/chat:
    // without a claim, fix-sql spend would never create usage_turns rows and
    // the daily count check above could never trip. An already-claimed turn
    // (the normal in-flow case) returns "already-claimed" and proceeds.
    try {
        const claim = await claimTurn(auth.user.id, turnId)

        if (claim === "quota-exceeded") {
            return NextResponse.json(
                {
                    error:
                        "You've reached today's free limit of 20 queries. Please come back tomorrow.",
                },
                {
                    status: 429,
                },
            )
        }
    } catch (err) {
        console.error("claim_turn failed:", err)

        return NextResponse.json(
            { error: "Unable to verify your daily quota. Please try again." },
            { status: 503 }
        )
    }

    if (
        typeof userQuery !== "string" ||
        typeof failedSql !== "string" ||
        typeof error !== "string" ||
        !schemas ||
        typeof schemas !== "object"
    ) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        )
    }

    const prompt = fixSQLPrompt({
        userQuery,
        failedSql,
        error: typeof rawError === "string" && rawError.trim() ? rawError : error,
        schemas: schemas as Record<string, Array<{ column_name: string; column_type: string }>>,
        relationships: Array.isArray(relationships)
            ? (relationships as Parameters<typeof fixSQLPrompt>[0]["relationships"])
            : [],
        currentDateHint: typeof currentDateHint === "string" ? currentDateHint : ""
    })

    const result = await groqWithRetry({
        label: "fix-sql",
        signal: req.signal,
        call: () =>
            groq.chat.completions.create({
                model: "openai/gpt-oss-120b",
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
            }, { signal: req.signal })
    })

    if (result.status !== "ok") {
        return NextResponse.json(
            { error: "AI generation failed. Please try again." },
            { status: 500 }
        )
    }

    const completion = result.completion

    const raw = completion.choices[0]?.message?.content || ""

    const xmlMatch = raw.match(/<sql>([\s\S]*?)<\/sql>/i)
    const sql = xmlMatch ? xmlMatch[1].trim() : ""

    const cleanedSQL = sql.replace(/```sql|```/g, "").trim()

    // Reuse the canonical safety policy — no independent blocklist.
    const safetyError = checkSQLSafetySync(cleanedSQL)
    if (safetyError) {
        return NextResponse.json({ error: safetyError }, { status: 400 })
    }

    const schemaError = validateAgainstSchema(cleanedSQL, schemas)
    if (schemaError) {
        return NextResponse.json({ error: schemaError }, { status: 400 })
    }

    return NextResponse.json({ sql: cleanedSQL })

}
