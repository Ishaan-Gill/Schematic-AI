import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";
import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { NextResponse } from "next/server";
import { explainSQL } from "@/lib/ai/chat/analysis";

export async function POST(req: Request) {
  const auth = await authorizeAIRequest(req, "explain-sql", 5, 60000, "Too many AI fix attempts.");
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

  const {
    query,
    sql,
    result,
    schemas,
    relevantTables,
    relationships,
    finalDatasetContext,
  } = body;

  if (!query || !schemas || !sql || !result) {
    return NextResponse.json(
      { error: "Missing required fields (query or schemas)" },
      { status: 400 },
    );
  }

  const explanation = await explainSQL({
    query,
    sql,
    result,
    schemas,
    relevantTables: relevantTables ?? [],
    relationships: relationships ?? [],
    finalDatasetContext: finalDatasetContext ?? {},
  });

  if (!explanation) {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ response: explanation });
}
