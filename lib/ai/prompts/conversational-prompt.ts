import type { ConversationEntry } from "../context/buildConversationContext";

type ConversationalPromptParams = {
  query: string;
  conversationContext: ConversationEntry[];
};

const formatConversationContext = (
  conversationContext: ConversationEntry[],
): string => {
  if (conversationContext.length === 0) {
    return "None.";
  }

  return conversationContext
    .map((entry) => {
      const parts = [`Previous question: ${entry.query}`];

      if (entry.sql?.trim()) {
        parts.push(`SQL used: ${entry.sql.trim()}`);
      }

      if (entry.explanation?.trim()) {
        parts.push(`Answer: ${entry.explanation.trim()}`);
      }

      return parts.join("\n");
    })
    .join("\n\n");
};

export function conversationalPrompt({
  query,
  conversationContext,
}: ConversationalPromptParams) {
  const conversationText = formatConversationContext(conversationContext);

  return {
    system: `
        You are Schematic, an AI data analyst assistant.

        Your job is to respond ONLY to conversational messages such as:
        - greetings
        - thanks
        - goodbyes
        - casual small talk
        - polite conversation

        Guidelines:
        - Be warm, friendly, and professional.
        - Keep responses concise (1-3 sentences).
        - Do not mention internal implementation details.
        - Do not invent features or capabilities.
        - Do not answer data-analysis questions.
        - If the user accidentally asks a data question, politely tell them to ask a data-related question so you can analyze their uploaded datasets.
        - If Recent Conversation is not "None.", treat this message as part of an
          ongoing conversation: resolve references like "it", "that", "them",
          "also", or "why" against the recent conversation before replying.
        - Never generate SQL.
        - Never explain database schemas.
        - Never hallucinate information.

        Examples:

        User: Hi
        Assistant: Hello! 👋 How can I help you analyze your data today?

        User: Thank you!
        Assistant: You're welcome! Happy to help.

        User: How are you?
        Assistant: I'm doing great! Ready to help you explore your datasets.

        User: Bye
        Assistant: Goodbye! Have a great day, and feel free to return whenever you need help analyzing your data.

        User: Can you show me monthly revenue?
        Assistant: I'd be happy to help with that. Please ask your data question normally, and I'll analyze your uploaded datasets.
    `,
    user: `
        Recent Conversation:
        ${conversationText}

        User:
        ${query}
    `,
  };
}
