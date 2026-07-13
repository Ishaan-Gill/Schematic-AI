import { generateSQLPrompt } from "@/lib/ai/prompts/generate-sql-prompt";
import { checkRateLimit } from "@/lib/security/checkRateLimit";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "generate-sql", 5, 60000, "Too many AI fix attempts.");
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

  type FeedbackItem = {
    query: string;
    generatedSQL: string;
    outcome: "success" | "failure";
    timestamp: number;
    error?: string;
  };
  const {
    query,
    schemas,
    relevantTables,
    sampleRowsByTable,
    relationships,
    finalDatasetContext,
    timeHint,
    conversationContext,
  } = body;

  const feedbackMemory = (body.feedbackMemory ?? []) as FeedbackItem[];

  const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {};

  if (!query || !schemas) {
    return NextResponse.json(
      { error: "Missing required fields (query or schemas)" },
      { status: 400 },
    );
  }

  const finalRelevantTables =
    relevantTables?.length > 0 ? relevantTables : Object.keys(schemas);

  // text from filtered tables:
  const filteredSampleText = Object.entries(sampleRowsByTable)
    .filter(([tableName]) => finalRelevantTables?.includes(tableName))
    .map(
      ([tableName, rows]) => `${tableName}:\n${JSON.stringify(rows, null, 2)}`,
    )
    .join("\n\n");

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

  // Feedback:
  const recentFailures = feedbackMemory
    .filter((item) => item.outcome === "failure")
    .slice(-5);

  const prompt = generateSQLPrompt({
    schemaText,
    filteredRelationships,
    timeHint,
    safeDatasetContext,
    filteredSampleText,
    recentFailures,
    query,
    conversationContext,
  });

  let completion;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
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
        console.error(`Groq attempt (generate-sql) ${attempt} failed:`, err);
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

  const raw = completion.choices[0]?.message?.content || "";

  const DEBUG = process.env.NODE_ENV === "development";
  if (DEBUG) {
    console.log("AI RAW:", raw);
  }

  const xmlMatch = raw.match(/<sql>([\s\S]*?)<\/sql>/i);
  const sql = xmlMatch ? xmlMatch[1].trim() : "";

  if (!sql) {
    return NextResponse.json(
      {
        error: "Something went wrong generating your query. Please try again.",
      },
      { status: 502 },
    );
  }

  if (sql === "INVALID_QUERY") {
    return NextResponse.json(
      {
        error:
          "I couldn't answer this from your uploaded datasets. Try rephrasing your question.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ sql });
}
