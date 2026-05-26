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
        relevantTables,
        sampleRowsByTable,
        relationships,
        finalDatasetContext,
        timeHint
    } = body

    const feedbackMemory = (body.feedbackMemory ?? []) as FeedbackItem[]

    const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {}

    if (!query || !schemas) {
        return NextResponse.json(
            { error: "Missing required fields (query or schemas)" },
            { status: 400 }
        )
    }

    const finalRelevantTables =
        relevantTables?.length > 0
            ? relevantTables
            : Object.keys(schemas)

    // text from filtered tables:
    const filteredSampleText = Object.entries(sampleRowsByTable)
        .filter(([tableName]) =>
            finalRelevantTables?.includes(tableName)
        )
        .map(([tableName, rows]) =>
            `${tableName}:\n${JSON.stringify(rows, null, 2)}`
        )
        .join("\n\n")

    // Schemas of filtered Tables:
    const filteredSchemas = Object.fromEntries(
        Object.entries(schemas).filter(([tableName]) =>
            finalRelevantTables?.includes(tableName)
        )
    )

    // convert schema to readable text for AI:
    const schemaText = Object.entries(filteredSchemas).slice(0, 8)
        .map(([tableName, cols]) => {
            const colText = (cols as any[]).slice(0, 30)
                .map((col: any) => `${col.column_name} (${col.column_type})`)
                .join(", ")
            return `${tableName}: ${colText}`
        })
        .join("\n\n")

    const filteredRelationships = relationships.filter(
        (r: any) =>
            finalRelevantTables?.includes(r.fromTable) &&
            finalRelevantTables?.includes(r.toTable)
    )

    // Feedback:
    const recentFailures = feedbackMemory
        .filter((item) => item.outcome === "failure")
        .slice(-5)

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
                            
                            Only join tables if an explicit relationship is provided.
                            
                            If no relationship exists between tables:
                            do NOT invent joins.
                            
                            Never assume columns with similar meanings are joinable unless explicitly related.
                            `
                    },
                    {
                        role: "user",
                        content: `
                            Schema:
                            ${schemaText}
                            
                            Relationships:
                            ${filteredRelationships.length > 0
                                ? filteredRelationships
                                    .map((r: any) =>
                                        `${r.fromTable}.${r.fromColumn} = ${r.toTable}.${r.toColumn}`
                                    )
                                    .join("\n")
                                : "No relationships detected. Do not join tables."}  
                            TIME HINTS:
                            ${timeHint ?? ""}
                            
                            SEMANTIC HINTS:
                            ${Object.entries(safeDatasetContext).map(([tableName, ctx]: [string, any]) => {
                                    const hints = (ctx.metadata ?? []).slice(0, 30).map((item: any) =>
                                        `  - ${item.column} → ${item.semanticRole}${item.detectedFormat ? ` (${item.detectedFormat})` : ""}`
                                    ).join("\n")
                                    return `${tableName}:\n${hints}`
                                }).join("\n\n")}
                        
                            DERIVED METRICS:
                            ${Object.entries(safeDatasetContext).map(([tableName, ctx]: [string, any]) =>
                                    (ctx.metrics ?? []).slice(0, 20).map((metric: any) =>
                                        `- [${tableName}] ${metric.name} = ${metric.expression}`
                                    ).join("\n") ?? ""
                                ).join("\n")}
                
                            Sample Data:
                            ${filteredSampleText}
                            
                            Recent Failed Queries:
                            ${JSON.stringify(recentFailures)}
                            
                            User Request:
                            "${query}"
                        `
                    }
                ]
            })
            break

        } catch (err) {
            const DEBUG = process.env.NODE_ENV === "development"
            if (DEBUG) {
                console.error(`Groq attempt ${attempt} failed:`, err)
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
        .replace(/```sql|```/g, "")
        .trim()

    const sql = cleanedSQL.trim()

    if (
        sql !== "INVALID_QUERY" &&
        !sql.toLowerCase().startsWith("select") &&
        !sql.toLowerCase().startsWith("with") &&
        !sql.toLowerCase().startsWith("describe")
    ) {
        return NextResponse.json(
            {error: "Something went wrong generating your query. Please try again."},
            {status: 502}
        )
    }
    if (sql === "INVALID_QUERY") {
        return NextResponse.json(
            { error: "I couldn't answer this from your uploaded datasets. Try rephrasing your question." },
            { status: 400 }
        )
    }
    return NextResponse.json({ sql: cleanedSQL })
}
