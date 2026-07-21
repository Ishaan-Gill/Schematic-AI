import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";
import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { consumeQuota } from "@/lib/api/consumeQuota";
import { NextResponse } from "next/server";
import { classifyIntent } from "@/lib/ai/chat/classify";

export async function POST(req: Request) {
  const auth = await authorizeAIRequest(req, "classify-intent", 5, 60000, "Too many intent classification attempts.");
  if (!auth.authorized) return auth.response;

  await consumeQuota(auth.user.id);

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

  const { query, schemas } = body;

  if (!query || !schemas) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const intent = await classifyIntent({
    query,
    schemas,
  });

  if (!intent) {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ intent });
}
