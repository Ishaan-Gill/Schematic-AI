import Groq from "groq-sdk"
import { NextResponse } from "next/server"
import { feedbackMemory } from "@/lib/upload/metadata/feedbackMemory"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const body = await req.json()
    const { query, schemas, selectedTable, sampleText, relationships, datasetContext } = body
    const safeDatasetContext = datasetContext ?? {
        metadata: [],
        metrics: [],
        categories: {},
        BUSINESS_METRICS: [],
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
You are a STRICT SQL generator for DuckDB.

YOUR TASK:
Convert the user request into EXACTLY ONE valid DuckDB SQL query using ONLY the provided schema.

━━━━━━━━━━━━━━━━━━━━
CORE RULES
━━━━━━━━━━━━━━━━━━━━

* Output ONLY SQL

* No markdown

* No explanations

* No comments

* Query MUST begin with:
  SELECT
  or
  WITH

* NEVER generate:
  INSERT
  UPDATE
  DELETE
  DROP
  ALTER
  CREATE
  TRUNCATE

* NEVER generate multiple statements

* NEVER use semicolons inside the query

* If the request cannot be answered using the schema:
  return EXACTLY:
  INVALID_QUERY

━━━━━━━━━━━━━━━━━━━━
SCHEMA ENFORCEMENT
━━━━━━━━━━━━━━━━━━━━

Semantic Metadata:
${JSON.stringify(safeDatasetContext.metadata, null, 2)}

Known Categories:
${JSON.stringify(safeDatasetContext.categories, null, 2)}

Business Concepts:
${JSON.stringify(safeDatasetContext.BUSINESS_METRICS, null, 2)}

* Use ONLY tables and columns present in the schema
* NEVER invent columns
* NEVER invent tables
* NEVER invent aliases referencing nonexistent columns
* Before returning SQL:
  verify every referenced column exists

If a required column does not exist:
return INVALID_QUERY

━━━━━━━━━━━━━━━━━━━━
DUCKDB SQL RULES
━━━━━━━━━━━━━━━━━━━━

This query MUST be valid DuckDB SQL.

NEVER use:

* TO_DATE()
* DATEADD()
* DATE_SUB()
* MONTH()
* GETDATE()
* NVL()

ALWAYS prefer:

* STRPTIME()
* EXTRACT()
* DATE_TRUNC()
* CURRENT_DATE
* INTERVAL

Examples:

Correct:
STRPTIME(invoicedate, '%m/%d/%Y %H:%M')

Correct:
EXTRACT(MONTH FROM order_date)

Correct:
CURRENT_DATE - INTERVAL '1 month'

━━━━━━━━━━━━━━━━━━━━
DATE/TIME HANDLING
━━━━━━━━━━━━━━━━━━━━

Some CSV datasets store dates as VARCHAR.

If a date column is VARCHAR:

* parse it using STRPTIME()

Example:
STRPTIME(invoicedate, '%m/%d/%Y %H:%M')

If format is unclear:
infer format from sample data.

For relative date queries:
DO NOT assume CURRENT_DATE matches dataset dates.

Instead use dataset-relative filtering:

Example:
WHERE order_date >= (
SELECT MAX(order_date) - INTERVAL '1 month'
FROM table_name
)

━━━━━━━━━━━━━━━━━━━━
STRING FILTERING
━━━━━━━━━━━━━━━━━━━━

ALL string comparisons MUST be case-insensitive.

ALWAYS use:
LOWER(column)

Examples:

Correct:
WHERE LOWER(country) = 'france'

Correct:
WHERE LOWER(category) LIKE '%electronics%'

NEVER use:
WHERE country = 'France'

━━━━━━━━━━━━━━━━━━━━
AGGREGATION RULES
━━━━━━━━━━━━━━━━━━━━

Keywords:

* top
* best
* highest
* most
* lowest

usually require aggregation.

Rules:

* GROUP BY all non-aggregated columns
* ORDER BY aggregate DESC
* LIMIT 10 by default

Use:

* COUNT(*) for counts/frequency
* COUNT(DISTINCT column) for unique counts
* SUM(...) for totals
* AVG(...) for averages

━━━━━━━━━━━━━━━━━━━━
DERIVED METRICS
━━━━━━━━━━━━━━━━━━━━

Use ONLY metrics derivable from existing columns.

Derived Metrics:
${JSON.stringify(safeDatasetContext.metrics, null, 2)}

NEVER invent business metrics.

If revenue/spending requires unavailable columns:
return INVALID_QUERY

━━━━━━━━━━━━━━━━━━━━
PREVIOUS QUERY FEEDBACK
━━━━━━━━━━━━━━━━━━━━

Recent Successful Queries:
${JSON.stringify(recentSuccesses, null, 2)}

Recent Failed Queries:
${JSON.stringify(recentFailures, null, 2)}

Learn from previous failures.

Avoid generating SQL patterns that previously failed.

If a previous query failed because of a missing column/table:
DO NOT repeat the same mistake.

━━━━━━━━━━━━━━━━━━━━
JOINS & RELATIONSHIPS
━━━━━━━━━━━━━━━━━━━━

Use provided relationships when joining tables.

Prefer:
INNER JOIN

Relationships:
${relationships.join("\n")}

━━━━━━━━━━━━━━━━━━━━
ADVANCED ANALYTICS
━━━━━━━━━━━━━━━━━━━━

For:

* top product per country
* top N per group
* ranking problems

Use:
ROW_NUMBER() OVER (
PARTITION BY ...
ORDER BY ...
)

Do NOT use LIMIT for grouped ranking problems.

━━━━━━━━━━━━━━━━━━━━
FILTERING RULES
━━━━━━━━━━━━━━━━━━━━

* Apply WHERE before aggregation
* Use HAVING only for aggregated filters

━━━━━━━━━━━━━━━━━━━━
NULL HANDLING
━━━━━━━━━━━━━━━━━━━━

When appropriate:

* exclude NULL values
* use IS NOT NULL
* avoid aggregating malformed values

━━━━━━━━━━━━━━━━━━━━
PERFORMANCE RULES
━━━━━━━━━━━━━━━━━━━━

* Avoid SELECT *
* Select only required columns
* Prefer aggregation over raw row expansion
* Avoid unnecessary nested queries

━━━━━━━━━━━━━━━━━━━━
DATA CONTEXT
━━━━━━━━━━━━━━━━━━━━

Tables:
${schemaText}

Sample Data:
${sampleText}

━━━━━━━━━━━━━━━━━━━━
USER REQUEST
━━━━━━━━━━━━━━━━━━━━

"${query}"

━━━━━━━━━━━━━━━━━━━━
FINAL VALIDATION
━━━━━━━━━━━━━━━━━━━━

Before returning SQL verify:

* all columns exist
* all tables exist
* DuckDB syntax is valid
* no hallucinated metrics exist
* no forbidden SQL exists
* string filters use LOWER()
* query starts with SELECT or WITH

If ANY rule fails:
return INVALID_QUERY

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
            !sql.toLowerCase().startsWith("with")
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
