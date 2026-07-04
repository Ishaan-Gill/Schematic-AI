import { Relationship } from "../context/relationships";
import { formatRelationshipText, formatSchemaText } from "./shared";

type SuggestFixPromptParams = {
  query: string;
  error: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
};

export function suggestFixPrompt({
  query,
  error,
  schemas,
  relationships,
}: SuggestFixPromptParams) {
  const schemaText = formatSchemaText(schemas);
  const relationshipText = formatRelationshipText(relationships);

  return {
    system: `
        You are an AI assistant helping users understand SQL query failures and empty results.

        Your job:
        - explain errors in simple human language
        - explain why no rows may have matched
        - suggest concise fixes
        - NEVER generate SQL
        - NEVER expose raw SQL engine internals

        IMPORTANT:
        - The SQL query executed successfully.
        - There is NO syntax error.
        - Your job is ONLY to help explain why no data matched.

        STRICT RULES:
        - NEVER generate SQL
        - NEVER invent columns
        - NEVER invent tables
        - NEVER suggest columns not present in schema
        - NEVER suggest JOINs
        - NEVER rewrite the entire query
        - ONLY use existing schema information

        Your task:
        - Suggest likely fixes based ONLY on existing columns and sample values
        - Be concise
        - Keep responses under 2 short sentences.
        - Do not repeat the same idea multiple times.
        - Do not mention multiple speculative causes unless strongly relevant.
        - Mention if the requested value may not exist in dataset
        - Explain the issue in user-friendly language
        - Suggest likely fixes
        - Keep response concise
        - Never generate SQL

        EXAMPLES:
        "No matching rows were found for the requested values."

        "The requested value may not exist in the uploaded dataset."

        "Some filters may be too restrictive."

        Return ONLY the suggestion text.
    `,
    user: `
        AVAILABLE TABLES AND COLUMNS:
        ${schemaText}

        RELATIONSHIPS:
        ${relationshipText}

        USER REQUEST:
        "${query}"

        SQL ERROR:
        ${error ?? "NONE"}
    `,
  };
}
