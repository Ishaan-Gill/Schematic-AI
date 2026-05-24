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
        sampleText,
        relationships,
        datasetContext,
        timeHint
    } = body

    const feedbackMemory = (body.feedbackMemory ?? []) as FeedbackItem[]

    const safeDatasetContext = datasetContext ?? {
        metadata: [],
        metrics: [],
    }

    if (!query || !schemas) {
        return NextResponse.json(
            { error: "Missing required fields (query or schemas)" },
            { status: 400 }
        )
    }

    // convert schema to readable text:
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

    let completion
    let lastError

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
                            
                            Schema:
                            ${schemaText}
                                
                            Relationships:
                            ${relationships.length > 0
                                ? relationships.map((r: any) =>
                                    `JOIN ${r.toTable} ON ${r.fromTable}.${r.fromColumn} = ${r.toTable}.${r.toColumn}`
                                ).join("\n")
                                : "No relationships detected. Do not join tables."}  
                                  
                            Only join tables if an explicit relationship is provided.
                                
                            If no relationship exists between tables:
                            do NOT invent joins.
                                
                            Never assume columns with similar meanings are joinable unless explicitly related.
                                
                            TIME HINTS:
                            ${timeHint ?? ""}

                            SEMANTIC HINTS:
                            ${Object.entries(safeDatasetContext).map(([tableName, ctx]: [string, any]) => {
                                    const hints = ctx.metadata.map((item: any) =>
                                        `  - ${item.column} → ${item.semanticRole}${item.detectedFormat ? ` (${item.detectedFormat})` : ""}`
                                    ).join("\n")
                                    return `${tableName}:\n${hints}`
                                }).join("\n\n")}
                                
                            DERIVED METRICS:
                            ${Object.entries(safeDatasetContext).map(([tableName, ctx]: [string, any]) =>
                                    ctx.metrics?.map((metric: any) =>
                                        `- [${tableName}] ${metric.name} = ${metric.expression}`
                                    ).join("\n") ?? ""
                                ).join("\n")}
                        
                            Sample Data:
                            ${sampleText}
                        
                            Recent Failed Queries:
                            ${JSON.stringify(recentFailures)}
                        
                            User Request:
                            "${query}"
                        `
                    }
                ]
            })
        } catch (err) {
            console.error(`Groq attempt ${attempt} failed:`, err)

            // Small delay before retry:
            await new Promise(resolve => setTimeout(resolve, 1000))
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
        return NextResponse.json({
            error: "Invalid SQL generated"
        })
    }
    return NextResponse.json({ sql: cleanedSQL })
}
