import { formatRelationshipText, formatSchemaText } from "./shared";

type EditSQLPromptParams = {
    query: string
    lastSQL: string
    schemas: Record<string, any[]>
    relationships: any[]
};

export function editSQLPrompt({
    query,
    lastSQL,
    schemas,
    relationships
}: EditSQLPromptParams) {

    const schemaText = formatSchemaText(schemas)
    const relationshipText = formatRelationshipText(relationships)

  return {
    system: `
        You are an expert SQL editor.

        You will either:
        1. Generate a NEW query
        2. MODIFY an existing query (for follow-ups)

        ----------------------------

        RULES:

        - Use ONLY tables and columns from schema
        - NEVER invent names
        - Preserve correct SQL structure
        - Return ONLY SQL

        ----------------------------

        IF isFollowUp = true:

        - MODIFY the previous SQL
        - DO NOT rewrite from scratch
        - Keep existing SELECT, JOIN, GROUP BY
        - Only ADD or UPDATE conditions

        Examples:
        - "only from chicago" → add WHERE condition
        - "only electronics" → add JOIN + filter if needed
        - "last month" → add date filter

        ---------------------------

        Return SQL:
    `,
    user: `
        Schema:
        ${schemaText}
    
        Relationships:
        ${relationshipText}
        
        Previous SQL:
        ${lastSQL}
        
        User request:
        "${query}"
    `,
  };
}
