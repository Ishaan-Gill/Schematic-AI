// Server-only Groq executor (called by app/api/* routes — never import from client components).
import { conversationalPrompt } from "@/lib/ai/prompts/conversational-prompt";
import { groq } from "@/lib/ai/client";
import { groqWithRetry } from "@/lib/ai/groqRetry";
import { DEBUG } from "@/lib/config/debug";
import type { ConversationEntry } from "../context/buildConversationContext";

type ConversationalParams = {
  query: string;
  conversationContext?: ConversationEntry[];
  signal?: AbortSignal;
};

export async function conversational({
  query,
  conversationContext,
  signal,
}: ConversationalParams): Promise<string | null> {
  const prompt = conversationalPrompt({
    query,
    conversationContext: conversationContext ?? [],
  });

  const attempt = await groqWithRetry({
    label: "conversational",
    signal,
    call: () =>
      groq.chat.completions.create(
        {
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
        },
        { signal },
      ),
  });

  if (attempt.status !== "ok") return null;

  const completion = attempt.completion;

  const result = completion.choices[0].message.content?.trim() || "";

  if (DEBUG) {
    console.log("AI RAW (conversational):", result);
  }

  return result;
}
