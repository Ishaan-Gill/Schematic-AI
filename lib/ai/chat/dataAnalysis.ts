import { groq } from "@/lib/ai/client";
import { DEBUG } from "@/lib/config/debug";
import { dataAnalysisPrompt } from "@/lib/ai/prompts/data-analysis-prompt";
import type { ConversationEntry } from "../context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import type { ToolResult } from "../core/types";

type DataAnalysisParams = {
  query: string;
  sql: string;
  rows: Record<string, unknown>[];
  displayedRowCount: number;
  hasMore: boolean;
  schemas: Record<string, unknown[]>;
  relevantTables: string[];
  relationships: Relationship[];
  finalDatasetContext: Record<string, unknown>;
  conversationContext: ConversationEntry[];
  warnings?: string[];
  normalizationNotes?: string[];
  signal?: AbortSignal;
  guard?: () => boolean;
};

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

const ROW_LIMIT = 50;

const cancelled = (): ToolResult<{ analysis: string }> => ({
  tool: "data-analysis",
  ok: false,
  action: "stop",
  error: {
    code: "REQUEST_CANCELLED",
    message: "Request cancelled.",
  },
});

export async function dataAnalysis({
  query,
  sql,
  rows,
  displayedRowCount,
  hasMore,
  schemas,
  relevantTables,
  relationships,
  finalDatasetContext,
  conversationContext,
  warnings = [],
  normalizationNotes = [],
  signal,
  guard,
}: DataAnalysisParams): Promise<ToolResult<{ analysis: string }>> {
  if (!isActive(guard, signal)) return cancelled();

  const finalRelevantTables =
    relevantTables.length > 0 ? relevantTables : Object.keys(schemas);

  const filteredSchemas = Object.fromEntries(
    Object.entries(schemas).filter(([tableName]) =>
      finalRelevantTables.includes(tableName),
    ),
  );

  const filteredRelationships = relationships.filter(
    (r) =>
      finalRelevantTables.includes(r.fromTable) &&
      finalRelevantTables.includes(r.toTable),
  );

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const effectiveWarnings = [...warnings];

  if (rows.length > ROW_LIMIT) {
    effectiveWarnings.push(
      `The result contains ${rows.length} rows, but only the first ${ROW_LIMIT} rows were provided for analysis.`,
    );
  }

  const prompt = dataAnalysisPrompt({
    schemas: filteredSchemas,
    relationships: filteredRelationships,
    finalDatasetContext,
    conversationContext,
    resultPayload: {
      query,
      sql,
      columns,
      rows: rows.slice(0, ROW_LIMIT),
      displayedRowCount,
      hasMore,
      normalizationNotes,
      warnings: effectiveWarnings,
    },
  });

  let completion;
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (!isActive(guard, signal)) return cancelled();

    try {
      completion = await groq.chat.completions.create(
        {
          model: "openai/gpt-oss-120b",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: prompt.system,
            },
            {
              role: "user",
              content: prompt.user,
            },
          ],
        },
        { signal },
      );
      break;
    } catch (err) {
      if (signal?.aborted) return cancelled();

      console.error(`Groq attempt (data-analysis) ${attempt} failed:`, err);

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (!completion) {
    return {
      tool: "data-analysis",
      ok: false,
      action: "retry",
      error: {
        code: "DATA_ANALYSIS_NO_RESPONSE",
        message:
          "Something went wrong analyzing your results. Please try again.",
      },
    };
  }

  const analysis = completion.choices[0]?.message?.content?.trim() || "";

  if (DEBUG) {
    console.log("AI RAW (data-analysis):", analysis);
  }

  if (!analysis) {
    return {
      tool: "data-analysis",
      ok: false,
      action: "retry",
      error: {
        code: "DATA_ANALYSIS_EMPTY_RESPONSE",
        message:
          "I couldn't produce an analysis for that question. Please try again.",
      },
    };
  }

  return {
    tool: "data-analysis",
    ok: true,
    action: "continue",
    data: { analysis },
  };
}
