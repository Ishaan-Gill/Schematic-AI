import { reasoningPrompt } from "@/lib/ai/prompts/reasoning-prompt";
import { checkRateLimit } from "@/lib/security/checkRateLimit";
import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";
import { groq } from "@/lib/ai/client";
import { DEBUG } from "@/lib/config/debug";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "reasoning", 5, 60000, "Too many reasoning attempts.");
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

    const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {};

    const prompt = reasoningPrompt({
      query,
      schemas,
      relationships,
      safeDatasetContext,
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
        if (DEBUG) {
          console.error(`Groq attempt (reasoning) ${attempt} failed: `, err);
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

    const reasoning = completion.choices[0].message.content?.trim() || "";

    if (DEBUG) {
      console.log("AI RAW (reasoning):", reasoning);
    }

    return NextResponse.json({ response: reasoning });
}
