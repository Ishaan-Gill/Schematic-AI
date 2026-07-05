import { ExplainSQLPrompt } from "@/lib/ai/prompts/explain-sql-prompt";
import { checkRateLimit } from "@/lib/security/checkRateLimit";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const limited = checkRateLimit(req, 5, 60000, "Too many AI fix attempts.");
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400 },
    );
  }

  const {
    query,
    sql,
    result,
    schemas,
    relevantTables,
    relationships,
    finalDatasetContext,
  } = body;

  const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {};

  if (!query || !schemas || !sql || !result) {
    return NextResponse.json(
      { error: "Missing required fields (query or schemas)" },
      { status: 400 },
    );
  }

  const finalRelevantTables =
    relevantTables?.length > 0 ? relevantTables : Object.keys(schemas);

  // Schemas of filtered Tables:
  const filteredSchemas = Object.fromEntries(
    Object.entries(schemas).filter(([tableName]) =>
      finalRelevantTables?.includes(tableName),
    ),
  );

  // convert schema to readable text for AI:
  const schemaText = Object.entries(filteredSchemas)
    .slice(0, 8)
    .map(([tableName, cols]) => {
      const colText = (cols as any[])
        .slice(0, 30)
        .map((col: any) => `${col.column_name} (${col.column_type})`)
        .join(", ");
      return `${tableName}: ${colText}`;
    })
    .join("\n\n");

  const filteredRelationships = relationships.filter(
    (r: any) =>
      finalRelevantTables?.includes(r.fromTable) &&
      finalRelevantTables?.includes(r.toTable),
  );

  const prompt = ExplainSQLPrompt({
    schemaText,
    sql,
    result,
    filteredRelationships,
    safeDatasetContext,
    query,
  });

  let completion;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: prompt.system,
          },
          {
            role: "user",
            content: prompt.user,
          },
        ],
      });
      break;
    } catch (err) {
      const DEBUG = process.env.NODE_ENV === "development";
      if (DEBUG) {
        console.error(`Groq attempt (explain-sql) ${attempt} failed:`, err);
      }

      // Small delay before retry:
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  if (!completion) {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }

  const explanation = completion.choices[0].message.content?.trim() || "";

    const DEBUG = process.env.NODE_ENV === "development";
    if (DEBUG) {
      console.log("AI RAW (explanation):", explanation);
    }

    return NextResponse.json({ response: explanation });
}
