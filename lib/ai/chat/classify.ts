import { classifyIntentPrompt } from "@/lib/ai/prompts/classify-intent-prompt"
import { groq } from "@/lib/ai/client"
import { DEBUG } from "@/lib/config/debug"

type ClassifyIntentParams = {
  query: string
  schemas: Record<string, any[]>
}

export async function classifyIntent({
  query,
  schemas,
}: ClassifyIntentParams): Promise<string | null> {
  const prompt = classifyIntentPrompt({ query, schemas })

  let completion
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
      })
      break
    } catch (err) {
      if (DEBUG) {
        console.error(`Groq attempt (classify intent) ${attempt} failed: `, err)
      }

      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  if (!completion) return null

  const intent = completion.choices[0].message.content?.trim() || ""

  if (DEBUG) {
    console.log("Intent:", intent)
  }

  const valid = ["CONVERSATIONAL", "REASONING", "DATA_QUERY", "AMBIGUOUS"]
  return valid.includes(intent) ? intent : "AMBIGUOUS"
}
