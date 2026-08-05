import type { Relationship } from "../context/relationships";
import { schemaHash } from "@/lib/cache/schemaHash";
import {
  getCachedExplanation,
  saveCachedExplanation,
  buildExplanationCacheKey,
} from "@/lib/cache/explanationCache";

type ExplainSQLArgs = {
  query: string;
  sql: string;
  result: Record<string, unknown>[];
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  relevantTables: string[];
  finalDatasetContext: Record<string, any>;
  normalizationNotes?: string[];
  warnings?: string[];
  signal?: AbortSignal;
  guard?: () => boolean;
};

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

export const explainSQL = async ({
  query,
  sql,
  result,
  schemas,
  relationships,
  relevantTables,
  finalDatasetContext,
  normalizationNotes,
  warnings,
  signal,
  guard,
}: ExplainSQLArgs) => {
  try {
    if (!isActive(guard, signal)) return;

    const filteredSchemas = Object.fromEntries(
      Object.entries(schemas).filter(([tableName]) =>
        relevantTables?.includes(tableName),
      ),
    );
    const hash = await schemaHash(filteredSchemas);
    const cacheKey = await buildExplanationCacheKey(sql, hash);

    const cached = await getCachedExplanation(cacheKey);
    if (cached) return cached;

    const body = {
      query,
      sql,
      result,
      schemas,
      relationships,
      relevantTables,
      finalDatasetContext,
      normalizationNotes,
      warnings,
    };

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({ type: "analysis", payload: body }, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    });
    const data = await res.json();
    if (!isActive(guard, signal)) return;

    if (!res.ok) {
      throw new Error(data.error ?? "explanation failed");
    }

    const explanation = data.response as string;
    await saveCachedExplanation({ cacheKey, schemaHash: hash, explanation });
    return explanation;
  } catch (err) {
    if (signal?.aborted) return;
    console.error("explanation failed:", err);
  }
};
