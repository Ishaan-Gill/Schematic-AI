import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const body = await req.json()

    type FeedbackItem = {
        query: string
        generatedSQL: string
        outcome: "success" | "failure"
        timestamp: number
        error?: string
    }
    const {
        query,
        schemas,
        selectedTable,
        sampleText,
        relationships,
        datasetContext,
    } = body

    const feedbackMemory = (body.feedbackMemory ?? []) as FeedbackItem[]

    const safeDatasetContext = datasetContext ?? {
        metadata: [],
        metrics: [],
    }
    console.log("BODY:", body)

    if (!selectedTable || !query || !schemas) {
        return NextResponse.json(
            { error: "Missing required fields (query, schema or selectedTable)" },
            { status: 400 }
        )
    }

    // convert schema to readable text
    const schemaText = Object.entries(schemas)
        .map(([tableName, cols]) => {
            const colText = (cols as any[])
                .map((col: any) => `${col.column_name} (${col.column_type})`)
                .join(", ")
            return `${tableName}: ${colText}`
        })
        .join("\n\n")

    // Feedback:
    const recentFailures = feedbackMemory
        .filter((item) => item.outcome === "failure")
        .slice(-5)
    const recentSuccesses = feedbackMemory
        .filter((item) => item.outcome === "success")
        .slice(-5)

    const prompt = `
You are a DuckDB SQL generator.

Return ONLY one valid DuckDB SQL query.

Allowed statements:
SELECT
WITH
DESCRIBE

Never generate:
INSERT
UPDATE
DELETE
DROP
ALTER
CREATE
TRUNCATE

Use ONLY tables and columns from the provided schema.
Do not use information_schema unless the user explicitly asks for system metadata.

Never invent tables such as:
- Metadata
- Semantic_Metadata
- Data_Dictionary
- Analytics
- Relationships

Before returning SQL:
verify every referenced column exists in the exact referenced table.

If the request cannot be answered from schema:
return exactly:
INVALID_QUERY

DuckDB rules:
- Use TRY_STRPTIME instead of STRPTIME
- Use regexp_matches()
- Prefer DATE_TRUNC and EXTRACT
- Use LOWER() for string comparisons

If user asks for:
schema, columns, structure, fields, table design

prefer:
DESCRIBE "table_name"

Schema:
${schemaText}

Relationships:
${relationships.join("\n")}

SEMANTIC HINTS:
${safeDatasetContext.metadata.map((item: any) => {
    const format = item.detectedFormat
        ? ` (${item.detectedFormat})`
        : ""

    return `- ${item.column} → ${item.semanticRole}${format}`
}).join("\n")}

DERIVED METRICS:
${safeDatasetContext.metrics.map((metric: any) =>
    `- ${metric.name} = ${metric.expression}`
).join("\n")}

Sample Data:
${sampleText}

Recent Failed Queries:
${JSON.stringify(recentFailures)}

User Request:
"${query}"


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

        if (
            sql !== "INVALID_QUERY" &&
            !sql.toLowerCase().startsWith("select") &&
            !sql.toLowerCase().startsWith("with") &&
            !sql.toLowerCase().startsWith("describe")
        ) {
            return NextResponse.json({
                error: "Invalid SQL generated"
            })
        }

        return NextResponse.json({ sql: cleanedSQL })
    } catch (err) {
        console.error("Groq Error:", err)

        return NextResponse.json(
            { error: String(err) },
            { status: 500 }
        )
    }
}
