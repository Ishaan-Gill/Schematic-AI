import Groq from "groq-sdk"
import { NextResponse } from "next/server"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const body = await req.json()
    const { query, schemas, selectedTable, sampleText, relationships } = body
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

    const prompt = `
You are a STRICT SQL generator for DuckDB/PostgreSQL.

YOUR JOB:
Convert the user request into ONE valid SQL query using ONLY the provided schema.

--------------------------------------------------
HARD RULES (MUST FOLLOW)
--------------------------------------------------

- Use ONLY tables and columns from the schema
- NEVER invent tables or columns
- If impossible → return EXACTLY: INVALID_QUERY
- Output ONLY SQL (no explanations, no comments)
- Query MUST start with SELECT or WITH

--------------------------------------------------
SQL DIALECT (CRITICAL)
--------------------------------------------------

- Use DuckDB/PostgreSQL syntax
- NEVER use: DATE_SUB, DATEADD, MONTH()
- ALWAYS use:
  CURRENT_DATE - INTERVAL '1 month'
  CURRENT_DATE - INTERVAL '7 days'
  EXTRACT(MONTH FROM column)

--------------------------------------------------
JOINS & RELATIONSHIPS
--------------------------------------------------

- Use provided relationships for joins
- Prefer INNER JOIN
- Match keys logically (e.g., customer_id ↔ id)

RELATIONSHIPS:
${relationships.join("\n")}

--------------------------------------------------
STRING HANDLING (STRICT)
--------------------------------------------------

- ALL string comparisons MUST be case-insensitive
- ALWAYS use LOWER(column) = 'value'
- NEVER use direct equality without LOWER()

Example:
❌ City = 'Chicago'
✅ LOWER(City) = 'chicago'

--------------------------------------------------
AGGREGATION RULES
--------------------------------------------------

- "top", "best", "most" → require aggregation
- Use:
  SUM(Amount) for revenue/spending
  COUNT(*) for frequency

- Always:
  → GROUP BY non-aggregated columns
  → ORDER BY aggregate DESC
  → LIMIT 10 (unless using ROW_NUMBER)

--------------------------------------------------
COLUMN SEMANTICS
--------------------------------------------------

- Amount = total order value (already final)
- Price = unit price (DO NOT multiply unless explicitly asked)

--------------------------------------------------
TIME FILTERING
--------------------------------------------------

- If user mentions time:
  → MUST apply WHERE filter on a date column

- Use:
  column >= CURRENT_DATE - INTERVAL 'X'

Examples:
- "last month" → INTERVAL '1 month'
- "last 7 days" → INTERVAL '7 days'

- If NO date column exists → return INVALID_QUERY

--------------------------------------------------
ADVANCED QUERIES
--------------------------------------------------

- "top N per group":
  → Use ROW_NUMBER() with PARTITION BY
  → DO NOT use LIMIT

Example:
ROW_NUMBER() OVER (PARTITION BY City ORDER BY SUM(...) DESC)

--------------------------------------------------
FILTERING RULES
--------------------------------------------------

- Apply WHERE filters BEFORE aggregation
- Use HAVING only for aggregated filters

--------------------------------------------------
DATA CONTEXT
--------------------------------------------------

Tables:
${schemaText}

Sample Data:
${sampleText}

--------------------------------------------------
USER REQUEST
--------------------------------------------------

"${query}"

--------------------------------------------------
FINAL INSTRUCTION
--------------------------------------------------

Return ONLY the SQL query.
If uncertain → return INVALID_QUERY.

Examples:
WHERE LOWER(City) = 'chicago'
WHERE LOWER(Category) = 'electronics'

Before returning SQL, verify:
- All columns exist in schema
- All string filters use LOWER()
- SQL uses correct dialect
If any rule is violated → fix it before returning
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

        if (!sql.toLowerCase().startsWith("select") && !sql.toLowerCase().startsWith("with")) {
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