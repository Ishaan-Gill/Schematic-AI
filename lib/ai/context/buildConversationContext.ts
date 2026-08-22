import { Message } from "@/types/chat";

export type ConversationEntry = {
  query: string;
  sql?: string;
  explanation: string;
};

// Trivial CONVERSATIONAL replies (greetings, thanks, goodbyes) carry no
// useful context and are excluded so only substantive turns survive
const TRIVIAL_REPLY_PATTERN =
  /^(hi|hey|hello|thanks|thank you|you're welcome|welcome|goodbye|bye|great|awesome|nice|cool|sure|okay|ok|happy to help)\b/i;

export function buildConversationContext(
  messages: Message[],
): ConversationEntry[] {
  const entries: ConversationEntry[] = [];

  for (let i = 0; i < messages.length - 1; i++) {
    const userMsg = messages[i];
    const assistantMsg = messages[i + 1];

    if (userMsg.role === "user" && assistantMsg.role === "assistant") {
      const sql = assistantMsg.generatedSQL?.trim() || undefined;
      const explanation = (assistantMsg.content || "").trim();

      if (!sql && !explanation) continue;

      // Skip trivial conversational replies, keep substantive non-SQL turns
      if (
        !sql &&
        explanation.length < 200 &&
        TRIVIAL_REPLY_PATTERN.test(explanation)
      ) {
        continue;
      }

      entries.push({
        query: userMsg.content,
        sql,
        explanation,
      });
    }
  }

  return entries.slice(-2);
}
