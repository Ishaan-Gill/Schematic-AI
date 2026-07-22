import { getDuckConnection } from "@/lib/duckdb/duckdb";
import { isTimeQuery } from "@/lib/ai/timeQuery";
import { updateDetectedRelationships } from "@/lib/upload/metadata/detectRelationships";
import { validateSQL } from "./validateSQL";
import { feedbackMemory } from "@/lib/upload/metadata/feedbackMemory";
import {
  detectTableRelevance,
  expandRelevantTables,
} from "@/lib/ai/context/detectTableRelevance";
import { buildSQLContext } from "../ai/context/buildSQLContext";
import type { ConversationEntry } from "../ai/context/buildConversationContext";
import { normalizeQuery } from "../cache/normalizeQuery";
import { schemaHash } from "../cache/schemaHash";
import { buildCacheKey } from "../cache/buildCacheKey";
import { getCachedSQL, saveCachedSQL } from "../cache/queryCache";

type GenerateSQLArgs = {
  query: string;
  schemas: Record<string, any[]>;
  conversationContext: ConversationEntry[];
  signal?: AbortSignal;
  guard?: () => boolean;
};

type GenerateSQLResult =
  | {
      ok: true;
      sql: string;
      relevantTables: string[];
      finalDatasetContext: Record<string, any>;
    }
  | {
      ok: false;
      error: string;
    };

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

export const generateSQL = async ({
  query,
  schemas,
  conversationContext,
  signal,
  guard,
}: GenerateSQLArgs): Promise<GenerateSQLResult> => {
  const relationships = updateDetectedRelationships(schemas);
  const relevantTables = detectTableRelevance(query, schemas);
  const finalRelevantTables = expandRelevantTables(
    relevantTables,
    relationships,
  );

  const normalizedQuery = normalizeQuery(query);
  const hash = await schemaHash(
    Object.fromEntries(
      finalRelevantTables.map((table) => [table, schemas[table]]),
    ),
  );
  const cacheKey = buildCacheKey({
    normalizedQuery,
    schemaHash: hash,
  });

  const CANCELLED: GenerateSQLResult = {
    ok: false,
    error: "Request Cancelled.",
  };

  if (finalRelevantTables.length === 0) {
    return {
      ok: false,
      error: "No datasets loaded. Please upload a file first.",
    };
  }

  try {
    const conn = await getDuckConnection();

    if (!isActive(guard, signal)) return CANCELLED;

    const { finalDatasetContext } = await buildSQLContext({
      conn,
      tables: finalRelevantTables,
      schemas,
    });

    const cachedSQL = await getCachedSQL(cacheKey);
    if (cachedSQL) {
      return {
        ok: true,
        sql: cachedSQL,
        relevantTables: finalRelevantTables,
        finalDatasetContext,
      };
    }

    // Time hint
    const timeHint = isTimeQuery(query)
      ? `
        Time-based analytics query.
        Prefer DATE_TRUNC, EXTRACT, proper date filtering,
        and relative date logic where appropriate.
      `
      : "";

    const body = {
      query,
      schemas,
      relevantTables: finalRelevantTables,
      relationships,
      finalDatasetContext,
      feedbackMemory,
      timeHint,
      conversationContext,
    };

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify(
        {
          type: "generate",
          payload: body,
        },
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
      ),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || "Something went wrong. Please try again.",
      };
    }

    if (!isActive(guard, signal)) return CANCELLED;

    if (!data.sql) {
      return {
        ok: false,
        error: "Something went wrong. Please try again.",
      };
    }

    // validateSQL:
    const validationError = await validateSQL({
      sql: data.sql,
    });
    if (validationError) {
      return {
        ok: false,
        error: validationError,
      };
    }

    await saveCachedSQL({
      cacheKey,
      normalizedQuery,
      schemaHash: hash,
      sql: data.sql,
    });

    return {
      ok: true,
      sql: data.sql,
      relevantTables: finalRelevantTables,
      finalDatasetContext,
    };
  } catch (err) {
    if (signal?.aborted) return CANCELLED;
    console.error("AI error:", err);
    return {
      ok: false,
      error: "Something went wrong. Please try again.",
    };
  }
};
