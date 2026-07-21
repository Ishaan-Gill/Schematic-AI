import { ambiguousPrompt } from "@/lib/ai/prompts/ambiguous-prompt"
import { groq } from "@/lib/ai/client"
import { DEBUG } from "@/lib/config/debug"

type AmbiguousParams = {
  query: string
}

export async function ambiguous({
  query,
}: AmbiguousParams): Promise<string | null> {
  const prompt = ambiguousPrompt({ query })

  let completion
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
      })
      break
    } catch (err) {
      if (DEBUG) {
        console.error(`Groq attempt (ambiguous) ${attempt} failed: `, err)
      }

      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  if (!completion) return null

  const result = completion.choices[0].message.content?.trim() || ""

  if (DEBUG) {
    console.log("AI RAW (ambiguous):", result)
  }

  return result
}
