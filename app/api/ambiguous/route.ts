import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";
import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { NextResponse } from "next/server";
import { ambiguous } from "@/lib/ai/chat/ambiguous";

export async function POST(req: Request) {
  const auth = await authorizeAIRequest(req, "ambiguous", 5, 60000, "Too many ambiguous attempts.");
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

  const { query } = body;

  if (!query) {
    return NextResponse.json(
      { error: "Missing query" },
      { status: 400 },
    );
  }

  const result = await ambiguous({ query });

  if (!result) {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ response: result });
}
