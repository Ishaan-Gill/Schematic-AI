import { classifyIntentPrompt } from "@/lib/ai/prompts/classify-intent-prompt";
import { checkRateLimit } from "@/lib/security/checkRateLimit";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "classify-intent", 5, 60000, "Too many intent classification attempts.");
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
  const { query, schemas } = body;

  if (!query || !schemas) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const prompt = classifyIntentPrompt({
    query,
    schemas,
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
        console.error(`Groq attempt (classify intent) ${attempt} failed: `, err);
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

  const intent = completion.choices[0].message.content?.trim() || "";

  const DEBUG = process.env.NODE_ENV === "development";
  if (DEBUG) {
    console.log("Intent:", intent);
  }

  const valid = ["CONVERSATIONAL", "REASONING", "DATA_QUERY", "AMBIGUOUS"];

  const finalIntent = valid.includes(intent) ? intent : "AMBIGUOUS";

  return NextResponse.json({ intent: finalIntent });
}
