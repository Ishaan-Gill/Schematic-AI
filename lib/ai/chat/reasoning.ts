// Server-only Groq executor (called by app/api/* routes — never import from client components).
import { reasoningPrompt } from "@/lib/ai/prompts/reasoning-prompt"
import { groq } from "@/lib/ai/client"
import { groqWithRetry } from "@/lib/ai/groqRetry"
import { DEBUG } from "@/lib/config/debug"
import type { Relationship } from "@/lib/ai/context/relationships"
import type { ConversationEntry } from "../context/buildConversationContext"

type ReasoningParams = {
  query: string
  schemas: Record<string, any[]>
  relationships: Relationship[]
  finalDatasetContext: Record<string, any>
  conversationContext?: ConversationEntry[]
  signal?: AbortSignal
}

export async function reasoning({
  query,
  schemas,
  relationships,
  finalDatasetContext,
  conversationContext,
  signal,
}: ReasoningParams): Promise<string | null> {
  const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {}

  const prompt = reasoningPrompt({
    query,
    schemas,
    relationships,
    safeDatasetContext,
    conversationContext: conversationContext ?? [],
  })

  const attempt = await groqWithRetry({
    label: "reasoning",
    signal,
    call: () =>
      groq.chat.completions.create(
        {
          model: "openai/gpt-oss-120b",
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
        },
        { signal },
      ),
  })

  if (attempt.status !== "ok") return null

  const completion = attempt.completion

  const result = completion.choices[0].message.content?.trim() || ""

  if (DEBUG) {
    console.log("AI RAW (reasoning):", result)
  }

  return result
}
