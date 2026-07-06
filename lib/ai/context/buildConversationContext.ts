import { Message } from "@/types/message";

export type ConversationEntry = {
  query: string;
  sql: string;
  explanation: string;
};

export function buildConversationContext(
  messages: Message[],
): ConversationEntry[] {
  const entries: ConversationEntry[] = [];

  for (let i = 0; i < messages.length - 1; i++) {
    const userMsg = messages[i];
    const assistantMsg = messages[i + 1];

    if (
      userMsg.role === "user" &&
      assistantMsg.role === "assistant" &&
      assistantMsg.generatedSQL?.trim()
    ) {
      entries.push({
        query: userMsg.content,
        sql: assistantMsg.generatedSQL,
        explanation: assistantMsg.content || "",
      });
    }
  }

  return entries.slice(-2);
}
