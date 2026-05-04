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
You are a STRICT SQL generator.

RULES:
- You can use MULTIPLE tables
- Use JOINs when needed
- Only use tables and columns provided
- NEVER invent columns or tables
- If query cannot be answered → return INVALID_QUERY
- Prefer INNER JOIN
- Match columns logically (e.g. customer_id with id)
- Use LOWER() for string comparisons
- Do NOT perform calculations unless clearly required
- Prefer using existing aggregated fields (like Amount)
COLUMN MEANINGS:
- Amount = total money spent in the order (already final)
- Price = price per product (do not multiply with Amount unless explicitly needed)
- Add LIMIT 10 if not present
- Return ONLY SQL

RELATIONSHIPS:
${relationships.join("\n")}
- Use the give relationships to JOIN tables correctly

Sample Data:
${sampleText}

Tables:
${schemaText}

User request:
"${query}"

INTERPRETATION RULES:

- "top customers" → customers with highest total spending (SUM(Amount))
- "best selling products" → products with highest total sales (SUM(Amount))
- "high value users" → customers with highest total spending
- "most popular products" → products with highest number of orders (COUNT)

- Always use appropriate aggregation (SUM, COUNT) when terms like "top", "best", "most" are used

- If the query is vague, infer the most reasonable business meaning
- Prefer aggregation + GROUP BY for ranking queries

ADVANCED RULES:

- Combine filters, joins, and aggregations when needed
- If a location is mentioned → filter by City
- If a category is mentioned → filter by product Category
- If time is mentioned → filter by OrderDate
- Always apply filters BEFORE aggregation
- Use LEFT JOIN when finding missing data (e.g., customers with no orders)
- Use GROUP BY with partitions for per-group ranking
- Use HAVING for filtering aggregated results

ADVANCED GROUPING RULES:

- For queries like "top X per group":
  → Use ROW_NUMBER() with PARTITION BY

- Example:
  "top customer in each city" →
  PARTITION BY City ORDER BY SUM(...) DESC

- Do NOT use LIMIT for per-group ranking

- For date filtering, use:
  EXTRACT(MONTH FROM column) instead of MONTH(column)

CRITICAL:

- When using ROW_NUMBER() / PARTITION BY:
  → DO NOT use LIMIT
  → The WHERE clause (rn <= N) already limits results correctly

EXAMPLES:

Q: top customers
A:
SELECT c.FirstName, c.LastName, SUM(o.Amount) AS total_spent
FROM customer_contact_exp c
JOIN customer_order_exp o ON c.id = o.customer_id
GROUP BY c.FirstName, c.LastName
ORDER BY total_spent DESC
LIMIT 10;

Q: best selling products
A:
SELECT p.ProductName, SUM(o.Amount) AS revenue
FROM customer_order_exp o
JOIN customer_product_exp p ON o.product_id = p.id
GROUP BY p.ProductName
ORDER BY revenue DESC
LIMIT 10;

Q: top 2 customers in each city
A:
SELECT City, FirstName, LastName, total_spent
FROM (
  SELECT 
    c.City,
    c.FirstName,
    c.LastName,
    SUM(o.Amount) AS total_spent,
    ROW_NUMBER() OVER (
      PARTITION BY c.City 
      ORDER BY SUM(o.Amount) DESC
    ) as rn
  FROM customer_contact_exp c
  JOIN customer_order_exp o ON c.id = o.customer_id
  GROUP BY c.City, c.FirstName, c.LastName
) t
WHERE rn <= 2;

STRICT OUTPUT RULES (CRITICAL):

- Return ONLY executable SQL
- DO NOT include comments (--)
- DO NOT include explanations
- DO NOT include multiple queries
- Output must start with SELECT or WITH

Generate SQL:
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