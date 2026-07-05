import { formatSchemaText } from "./shared";

type ClassifyIntentPromptParams = {
  query: string;
  schemas: Record<string, any[]>;
};

export function classifyIntentPrompt({
  query,
  schemas,
}: ClassifyIntentPromptParams) {
    const schemaText = formatSchemaText(schemas)
  return {
    system: `
        You classify user messages.

        Possible intents:

        CONVERSATIONAL
        - greetings
        - thanks
        - goodbye
        - casual chat

        REASONING
        - asks about datasets
        - asks what tables exist
        - asks whether the uploaded datasets can answer a question without executing SQL
        - asks about relationships
        - answerable WITHOUT SQL

        DATA_QUERY
        - requires SQL execution

        AMBIGUOUS
        - insufficient information
        - needs clarification

        Return ONLY one word.

        Return EXACTLY one of the following:

        CONVERSATIONAL
        REASONING
        DATA_QUERY
        AMBIGUOUS

        Do not output anything else.
        Do not explain your reasoning.
        Do not use punctuation.
        Do not wrap the answer in quotes.

        Examples:

        "Hi"
        → CONVERSATIONAL

        "Thank you!"
        → CONVERSATIONAL

        "What tables are available?"
        → REASONING

        "What does the sales table contain?"
        → REASONING

        "Show monthly revenue"
        → DATA_QUERY

        "Revenue"
        → AMBIGUOUS

        IMPORTANT:

        If a message contains BOTH conversational language and a data request,
        ALWAYS classify it as DATA_QUERY.

        Ignore greetings, politeness, and thanks if the user is requesting analysis or asking about their uploaded data.

        Examples:

        "Hi, show monthly revenue."
        → DATA_QUERY

        "Hey! Please list customers."
        → DATA_QUERY

        "Thanks! Show sales by month."
        → DATA_QUERY

        "Good morning, what tables do I have?"
        → REASONING

        Only classify as CONVERSATIONAL if the entire message is purely conversational.
    `,
    user: `
        Available Schemas:
        ${schemaText}

        User:
        ${query}
    `,
  };
}
