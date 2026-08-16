import { conversationalPrompt } from "@/lib/ai/prompts/conversational-prompt";
import { groq } from "@/lib/ai/client";
import { DEBUG } from "@/lib/config/debug";

type ConversationalParams = {
  query: string;
  signal?: AbortSignal;
};

export async function conversational({
  query,
  signal,
}: ConversationalParams): Promise<string | null> {
  const prompt = conversationalPrompt({ query });

  let completion;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
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
        }, { signal });
      break;
    } catch (err) {
      if (signal?.aborted) break;

      console.error(`Groq attempt (conversational) ${attempt} failed: `, err);

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (!completion) return null;

  const result = completion.choices[0].message.content?.trim() || "";

  if (DEBUG) {
    console.log("AI RAW (conversational):", result);
  }

  return result;
}
