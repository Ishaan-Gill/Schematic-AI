import { Relationship } from "../context/relationships";
import type { ConversationEntry } from "../context/buildConversationContext";
import { getCurrentDateHint } from "../timeQuery";
import { formatRelationshipText, formatSchemaText } from "./shared";

type ReasoningPromptParams = {
  query: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  safeDatasetContext: Record<string, any>;
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

export function reasoningPrompt({
  query,
  schemas,
  relationships,
  safeDatasetContext,
  conversationContext,
}: ReasoningPromptParams) {
  const schemaText = formatSchemaText(schemas);
  const relationshipText = formatRelationshipText(relationships);
  const conversationText = formatConversationContext(conversationContext);

  return {
    system: `
        You are Schematic, an AI business data analyst.

        Your task is to answer ONLY questions about the uploaded dataset's structure and capabilities.

        You may answer questions about:
        - available tables
        - available columns
        - relationships between tables
        - semantic meaning of columns
        - detected date formats
        - derived metrics available
        - what analyses are possible
        - whether a user's question can be answered by executing SQL on the uploaded data
        Rules:
        - Use ONLY the provided schema and metadata.
        - Never invent tables, columns, relationships, or metrics.
        - Never generate SQL.
        - Never pretend you executed a query.
        - Never estimate values from sample data.
        - Never answer questions that require inspecting the actual data values.
        - Instead, politely explain that those require executing a SQL query.
        - If Recent Conversation is not "None.", treat this message as part of an
          ongoing conversation: resolve references like "it", "that", "them",
          "also", or "why" against the recent conversation before answering.
        - If the information is unavailable, clearly say so.
        - Keep responses concise (2 to 5 sentences).
        - Be professional and helpful.

        Examples:

        User: What tables are available?
        Assistant: The uploaded dataset contains Sales, Customers, and Products tables.

        User: Can I calculate customer lifetime value?
        Assistant: Yes. Based on the available Sales and Customers tables, customer lifetime value can likely be calculated.

        User: Which table contains customer information?
        Assistant: Customer-related information is stored in the Customers table.

        User: What was my highest revenue month?
        Assistant: That requires analyzing the dataset. Please ask it as a data query so I can execute the appropriate SQL.
    `,
    user: `
        Schema:
        ${schemaText}
    
        Relationships:
        ${relationshipText}
        
        SEMANTIC HINTS:
        ${Object.entries(safeDatasetContext)
          .map(([tableName, ctx]: [string, any]) => {
            const hints = (ctx.metadata ?? [])
              .slice(0, 30)
              .map(
                (item: any) =>
                  `  - ${item.column} → ${item.semanticRole}${item.detectedFormat ? ` (${item.detectedFormat})` : ""}${item.coercionNote ? ` — ${item.coercionNote}` : ""}`,
              )
              .join("\n");
            return `${tableName}:\n${hints}`;
          })
          .join("\n\n")}
                            
        DERIVED METRICS:
        ${Object.entries(safeDatasetContext)
          .map(
            ([tableName, ctx]: [string, any]) =>
              (ctx.metrics ?? [])
                .slice(0, 20)
                .map(
                  (metric: any) =>
                    `- [${tableName}] ${metric.name} = ${metric.expression}`,
                )
                .join("\n") ?? "",
          )
          .join("\n")}

        User request:
        "${query}"

        Recent Conversation:
        ${conversationText}

        Current Date:
        ${getCurrentDateHint()}
    `,
  };
}
