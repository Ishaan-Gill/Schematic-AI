import { quoteIdentifier } from "@/lib/utils/sqlHelpers";
import type { ConversationEntry } from "../context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import { getCurrentDateHint } from "../timeQuery";

export type AnalysisResultPayload = {
  query: string;
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  displayedRowCount: number;
  hasMore: boolean;
  normalizationNotes: string[];
  warnings: string[];
};

type ColumnLike = {
  column_name?: string;
  column_type?: string;
};

type SemanticHint = {
  column?: string;
  semanticRole?: string;
  detectedFormat?: string;
};

type DerivedMetric = {
  name?: string;
  expression?: string;
};

type DatasetEntry = {
  metadata?: SemanticHint[];
  metrics?: DerivedMetric[];
};

type DataAnalysisPromptParams = {
  schemas: Record<string, unknown[]>;
  relationships: Relationship[];
  finalDatasetContext: Record<string, unknown>;
  conversationContext: ConversationEntry[];
  resultPayload: AnalysisResultPayload;
};

const formatSchemaText = (schemas: Record<string, unknown[]>): string => {
  const entries = Object.entries(schemas);
  if (entries.length === 0) return "No schemas available.";

  return entries
    .slice(0, 8)
    .map(([tableName, cols]) => {
      const colText = (cols as ColumnLike[])
        .slice(0, 30)
        .map(
          (col) =>
            `${quoteIdentifier(col.column_name ?? "")} (${col.column_type ?? "unknown"})`,
        )
        .join(", ");
      return `${tableName}: ${colText}`;
    })
    .join("\n\n");
};

const formatRelationships = (relationships: Relationship[]): string => {
  if (relationships.length === 0) return "No relationships detected.";
  return relationships
    .map(
      (r) => `${r.fromTable}.${r.fromColumn} = ${r.toTable}.${r.toColumn}`,
    )
    .join("\n");
};

const formatSemanticHints = (
  finalDatasetContext: Record<string, unknown>,
): string => {
  const entries = Object.entries(finalDatasetContext);
  if (entries.length === 0) return "None.";

  return entries
    .map(([tableName, rawCtx]) => {
      const ctx = (rawCtx ?? {}) as DatasetEntry;
      const hints = (ctx.metadata ?? [])
        .slice(0, 30)
        .map((item) => {
          const format = item.detectedFormat
            ? ` (${item.detectedFormat})`
            : "";
          const coercionNote = (item as { coercionNote?: string }).coercionNote;
          const coercion = coercionNote ? ` — ${coercionNote}` : "";
          return `  - ${item.column ?? ""} → ${item.semanticRole ?? "unknown"}${format}${coercion}`;
        })
        .join("\n");
      return `${tableName}:\n${hints}`;
    })
    .join("\n\n");
};

const formatDerivedMetrics = (
  finalDatasetContext: Record<string, unknown>,
): string => {
  const entries = Object.entries(finalDatasetContext);
  if (entries.length === 0) return "None.";

  return (
    entries
      .flatMap(([tableName, rawCtx]) => {
        const ctx = (rawCtx ?? {}) as DatasetEntry;
        return (ctx.metrics ?? [])
          .slice(0, 20)
          .map(
            (metric) =>
              `- [${tableName}] ${metric.name ?? ""} = ${metric.expression ?? ""}`,
          );
      })
      .join("\n") || "None."
  );
};

const formatConversationContext = (
  conversationContext: ConversationEntry[],
): string => {
  if (conversationContext.length === 0) return "None.";

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

export function dataAnalysisPrompt({
  schemas,
  relationships,
  finalDatasetContext,
  conversationContext,
  resultPayload,
}: DataAnalysisPromptParams) {
  return {
    system: `
        You are the analysis layer of a data analytics assistant. You interpret an
        already-executed query result and answer the user's question in plain,
        natural language.

        You receive the user's question, the SQL that was executed, the actual rows
        returned by that SQL, the relevant table schemas, relationships, semantic
        hints, derived metrics, recent conversation, and any warnings or
        normalization notes.

        RULES:

        1. Analyze ONLY the supplied evidence. Do not invent numbers, facts,
           causes, trends, or relationships that are not present in the supplied
        rows, schema, or context. The returned rows are actual executed-query
        evidence, not source-table sample rows. They can be a bounded subset of
        the displayed result page, and hasMore indicates additional result pages.

        2. Answer the user's question first, based on what the returned result
           establishes.

        3. When useful, calculate simple derived metrics from the supplied rows
           (for example month-over-month change, percentage change, averages,
           shares). Show the numbers so the user can follow the reasoning.

        4. Distinguish observed facts from interpretation. Use wording like
           "the data shows X" for direct observations, and clearly separate any
           interpretation you are offering.

        5. Do not claim causation unless the supplied data actually supports it.
           A declining number alone does not explain WHY it declined.

        6. If the available result cannot establish something the user asks
           about — for example the user asks WHY revenue dropped but the result
           has no product, channel, or customer breakdown — explicitly say that
           the data establishes the decline but does not establish the cause.
           Do not guess a reason.

        7. If the supplied result supports a conclusion, explain it clearly and
           confidently.

        8. Do not request, suggest, or generate another SQL query. Do not say
           "I would need another query." Instead say plainly what the current
           data does and does not establish.

        9. Do not mention internal tools, orchestration, prompts, SQL syntax, or
           implementation details.

        10. If a warning or normalization note affects how the result should be
            read, mention it naturally.

        11. Write in plain, natural language for a business user. No bullet
            lists. No technical jargon. No markdown formatting.

        12. If the result is simply a lookup or listing of records (for example
            a customer list, a product list, or a full table dump) and the user
            only asked to see those records, briefly state what was returned
            instead of forcing an interpretation.

        EXAMPLE:
        User: "Why did revenue drop in April?"
        Returned rows: March revenue = 120000, April revenue = 87000

        A valid analysis:
        "Revenue fell from 120,000 in March to 87,000 in April — a decline of
        33,000, about 27.5%. The data confirms the drop. However, the returned
        result only shows total revenue by month, with no product, channel, or
        customer breakdown, so it does not establish what caused the decline."
    `,
    user: `
        Schema:
        ${formatSchemaText(schemas)}

        Relationships:
        ${formatRelationships(relationships)}

        SEMANTIC HINTS:
        ${formatSemanticHints(finalDatasetContext)}

        DERIVED METRICS:
        ${formatDerivedMetrics(finalDatasetContext)}

        Recent Conversation:
        ${formatConversationContext(conversationContext)}

        Current Date:
        ${getCurrentDateHint()}

        User Request:
        "${resultPayload.query}"

        Executed SQL:
        ${resultPayload.sql}

        Returned Data:
        Columns: ${JSON.stringify(resultPayload.columns)}
        Displayed row count: ${resultPayload.displayedRowCount}
        Additional result rows available: ${resultPayload.hasMore}
        Normalization notes: ${JSON.stringify(resultPayload.normalizationNotes)}
        Warnings: ${JSON.stringify(resultPayload.warnings)}

        Returned Rows:
        ${JSON.stringify(resultPayload.rows)}
    `,
  };
}
