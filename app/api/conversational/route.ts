import { conversationalPrompt } from "@/lib/ai/prompts/conversational-prompt";
import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";
import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { groq } from "@/lib/ai/client";
import { DEBUG } from "@/lib/config/debug";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await authorizeAIRequest(req, "conversational", 5, 60000, "Too many conversational attempts.");
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

  const prompt = conversationalPrompt({
    query,
  });

  let completion;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
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
      if (DEBUG) {
        console.error(`Groq attempt (conversational) ${attempt} failed: `, err);
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

  const conversational = completion.choices[0].message.content?.trim() || "";

  if (DEBUG) {
    console.log("AI RAW (conversational):", conversational);
  }

  return NextResponse.json({ response: conversational });
}
