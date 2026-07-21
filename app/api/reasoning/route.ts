import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";
import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { NextResponse } from "next/server";
import { reasoning } from "@/lib/ai/chat/reasoning";

export async function POST(req: Request) {
  const auth = await authorizeAIRequest(req, "reasoning", 5, 60000, "Too many reasoning attempts.");
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

  const { query, schemas, relationships, finalDatasetContext } = body;

  if (!query || !schemas) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const result = await reasoning({
    query,
    schemas,
    relationships: relationships ?? [],
    finalDatasetContext: finalDatasetContext ?? {},
  });

  if (!result) {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ response: result });
}
