import { Relationship } from "../context/relationships";
import { formatRelationshipText, formatSchemaText } from "./shared";

type FixSQLPromptParams = {
  userQuery: string;
  failedSql: string;
  error: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
};

export function fixSQLPrompt({
  userQuery,
  failedSql,
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

        Column naming rules:
        - Column names in the schema are the EXACT physical column names.
        - They may contain spaces, punctuation, currency symbols, %, #, parentheses, etc.
        - ALWAYS wrap every table and column identifier in double quotes, exactly as shown.
        - NEVER rename columns to simplified or normalized aliases.
    `,
    user: `
        Relationships:
        ${relationshipText}

        Tables:
        ${schemaText}

        User's Question:
        ${userQuery}

        Broken SQL:
        ${failedSql}

        Database Error:
        ${error}
    `,
  };
}
