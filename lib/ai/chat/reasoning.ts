import { reasoningPrompt } from "@/lib/ai/prompts/reasoning-prompt"
import { groq } from "@/lib/ai/client"
import { DEBUG } from "@/lib/config/debug"
import type { Relationship } from "@/lib/ai/context/relationships"

type ReasoningParams = {
  query: string
  schemas: Record<string, any[]>
  relationships: Relationship[]
  finalDatasetContext: Record<string, any>
  signal?: AbortSignal
}

export async function reasoning({
  query,
  schemas,
  relationships,
  finalDatasetContext,
  signal,
}: ReasoningParams): Promise<string | null> {
  const safeDatasetContext: Record<string, any> = finalDatasetContext ?? {}

  const prompt = reasoningPrompt({
    query,
    schemas,
    relationships,
    safeDatasetContext,
  })

  let completion
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      completion = await groq.chat.completions.create({
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
        }, { signal })
      break
    } catch (err) {
      if (signal?.aborted) break

      console.error(`Groq attempt (reasoning) ${attempt} failed: `, err)

      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  if (!completion) return null

  const result = completion.choices[0].message.content?.trim() || ""

  if (DEBUG) {
    console.log("AI RAW (reasoning):", result)
  }

  return result
}
