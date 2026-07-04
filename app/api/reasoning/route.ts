import { reasoningPrompt } from "@/lib/ai/prompts/reasoning-prompt";
import { checkRateLimit } from "@/lib/security/checkRateLimit";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const limited = checkRateLimit(req, 5, 60000, "Too many reasoning attempts.");
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
        const DEBUG = process.env.NODE_ENV === "development";
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

    const DEBUG = process.env.NODE_ENV === "development";
    if (DEBUG) {
      console.log("AI RAW (reasoning):", reasoning);
    }

    return NextResponse.json({ response: reasoning });
}
