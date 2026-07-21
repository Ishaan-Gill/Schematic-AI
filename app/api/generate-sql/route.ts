import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";
import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { NextResponse } from "next/server";
import { generateSQL } from "@/lib/ai/chat/generate";

export async function POST(req: Request) {
  const auth = await authorizeAIRequest(req, "generate-sql", 5, 60000, "Too many AI fix attempts.");
  if (!auth.authorized) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400 },
    );
  }

  if (isPayloadTooLarge(body)) {
    return NextResponse.json(
      { error: "Request payload too large" },
      { status: 413 },
    );
  }

  const { query, schemas, relevantTables, relationships, finalDatasetContext, timeHint, conversationContext, feedbackMemory } = body;

  if (!query || !schemas) {
    return NextResponse.json(
      { error: "Missing required fields (query or schemas)" },
      { status: 400 },
    );
  }

  const result = await generateSQL({
    query,
    schemas,
    relevantTables: relevantTables ?? [],
    relationships: relationships ?? [],
    finalDatasetContext: finalDatasetContext ?? {},
    timeHint,
    conversationContext: conversationContext ?? [],
    feedbackMemory: feedbackMemory ?? [],
  });

  if (!result) {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ sql: result.sql });
}
