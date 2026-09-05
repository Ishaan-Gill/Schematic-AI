// Client-side orchestrator (calls /api/* over fetch — safe for client components).
import type { ConversationEntry } from "../context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import { isActive } from "@/lib/ai/isActive";
import { bigIntReplacer } from "@/lib/chat/toJsonSafe";
import { schemaHash } from "@/lib/cache/schemaHash";
import {
  getCachedExplanation,
  saveCachedExplanation,
  buildExplanationCacheKey,
} from "@/lib/cache/explanationCache";
import type { CoreResult } from "./types";

type DataAnalysisArgs = {
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
  turnId: string;
  warnings?: string[];
  normalizationNotes?: string[];
  userId?: string | null;
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const dataAnalysis = async ({
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
  turnId,
  warnings = [],
  normalizationNotes = [],
  userId,
  signal,
  guard,
}: DataAnalysisArgs): Promise<CoreResult<string>> => {
  if (!isActive(guard, signal)) {
    return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
  }

  try {
    const filteredSchemas = Object.fromEntries(
      Object.entries(schemas).filter(([tableName]) =>
        relevantTables.includes(tableName),
      ),
    );
    const hash = await schemaHash(filteredSchemas);
    const context = JSON.stringify({
      query,
      relevantTables,
      relationships,
      datasetContext: finalDatasetContext,
      conversationContext,
    });
    const cacheKey = await buildExplanationCacheKey(
      sql,
      hash,
      context,
      userId ?? undefined,
    );

    const cached = await getCachedExplanation(cacheKey);
    if (!isActive(guard, signal)) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }
    if (cached) return { ok: true, data: cached };

    if (!isActive(guard, signal)) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify(
        {
          type: "data-analysis",
          payload: {
            query,
            sql,
            result: rows,
            displayedRowCount,
            hasMore,
            schemas,
            relevantTables,
            relationships,
            datasetContext: finalDatasetContext,
            conversationContext,
            warnings,
            normalizationNotes,
          },
          turnId,
        },
        bigIntReplacer,
      ),
    });
    const data = await res.json();
    if (!isActive(guard, signal)) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }

    if (!res.ok) {
      const rawError = data.error as string | { message?: string } | undefined;
      const errMessage =
        typeof rawError === "string"
          ? rawError
          : (rawError as { message?: string } | undefined)?.message;

      return {
        ok: false,
        cancelled: false,
        code: "DATA_ANALYSIS_FAILED",
        error:
          errMessage ??
          "Something went wrong analyzing your results. Please try again.",
      };
    }

    const analysis = data.analysis as string;
    await saveCachedExplanation({ cacheKey, schemaHash: hash, explanation: analysis });

    return { ok: true, data: analysis };
  } catch (err) {
    if (signal?.aborted) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }
    console.error("Data analysis failed:", err);

    return {
      ok: false,
      cancelled: false,
      code: "DATA_ANALYSIS_ERROR",
      error: "Something went wrong analyzing your results. Please try again.",
    };
  }
};
