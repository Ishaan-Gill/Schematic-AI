import { formatRelationshipText, formatSchemaText } from "./shared";

type FixSQLPromptParams = {
  query: string;
  error: string;
  schemas: Record<string, any[]>;
  relationships: any[];
};

export function fixSQLPrompt({
  query,
  error,
  schemas,
  relationships,
}: FixSQLPromptParams) {
  const schemaText = formatSchemaText(schemas);
  const relationshipText = formatRelationshipText(relationships);

  return {
    system: `
        You are a SQL repair engine.

        Your ONLY job:
        - repair invalid SQL
        - preserve original intent
        - NEVER invent columns
        - NEVER invent tables
        - ONLY use provided schema
        - Return ONLY executable SQL
    `,
    user: `
        Relationships:
        ${relationshipText}

        Tables:
        ${schemaText}

        Broken SQL:
        ${query}

        Database Error:
        ${error}
    `,
  };
}
