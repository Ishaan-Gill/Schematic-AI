import React from "react";

import { getDuckConnection, resetDuckConnection } from "@/lib/duckdb/duckdb";
import { suggestFix } from "@/lib/sql/suggestFix";
import { addFeedbackMemory } from "../upload/metadata/feedbackMemory";
import type { Relationship } from "../ai/context/relationships";
import { getRelationshipsMemory } from "../ai/context/relationshipsMap";
import { validateSQL } from "./validateSQL";
import { Message } from "@/types/chat";
import { buildExecutableSQL } from "./buildExecutableSQL";
import { validateQueryResult } from "./validateQueryResult";
import { recoverFailedQuery } from "./recoverFailedQuery";
import { fetchDatasets } from "../rehydration/fetchDatasets";
import { mountParquetViews } from "../duckdb/mountParquetViews";
import {
  getWorkspaceExpiry,
  setWorkspaceExpiry,
} from "../duckdb/workspaceExpiry";
import { updateStoredMessage } from "../chat/updateMessage";

type RunQueryArgs = {
  relevantTables?: string[];
  sql: string;
  query: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  page: number;
  PAGE_SIZE: number;
  signal?: AbortSignal;
  guard?: () => boolean;
  fixAttemptsRef: React.MutableRefObject<number>;
  assistantMessageId: string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
};

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

export const runQuery = async ({
  relevantTables,
  sql,
  query,
  schemas,
  relationships,
  page,
  PAGE_SIZE = 100,
  signal,
  guard,
  fixAttemptsRef,
  assistantMessageId,
  updateMessage,
}: RunQueryArgs): Promise<Record<string, unknown>[] | undefined> => {
  const startTime = performance.now();

  if (!isActive(guard, signal)) return;

  updateMessage(assistantMessageId, {
    error: undefined,
  });

  const { baseQuery, finalQuery } = buildExecutableSQL({
    sql,
    page,
    PAGE_SIZE: PAGE_SIZE,
  });

  const validationError = await validateSQL({ sql: finalQuery });
  if (validationError) {
    updateMessage(assistantMessageId, {
      error: validationError,
      loading: false,
    });
    return;
  }

  // Timeout protection:
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const TIMEOUT_MS = 8000;

  try {
    updateMessage(assistantMessageId, {
      error: undefined,
    });
    const conn = await getDuckConnection();

    if (Date.now() >= getWorkspaceExpiry()) {
      const datasets = await fetchDatasets();

      await mountParquetViews(conn, datasets);

      setWorkspaceExpiry(Date.now() + 6 * 60 * 60 * 1000);

      console.log("🔄 Signed URLs refreshed");
    }

    const timeoutPromise = new Promise<never>(
      (_, reject) =>
        (timeoutId = setTimeout(() => reject(new Error("Query timeout")), TIMEOUT_MS)),
    );

    const reader = await conn.send(finalQuery);

    const collectPromise = (async (): Promise<Record<string, unknown>[]> => {
      const rows: Record<string, unknown>[] = [];
      for await (const batch of reader) {
        const batchRows = batch.toArray();
        for (let i = 0; i < batchRows.length; i++) {
          rows.push({ ...(batchRows[i] as any) });
        }
      }
      return rows;
    })();

    collectPromise.catch(() => {});

    let rawRows: Record<string, unknown>[];
    try {
      rawRows = await Promise.race([collectPromise, timeoutPromise]);
    } catch (err) {
      if ((err as Error)?.message === "Query timeout") {
        try {
          const cancelled = await conn.cancelSent();
          if (!cancelled) {
            await resetDuckConnection();
          }
        } catch {}
      }
      throw err;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!isActive(guard, signal)) return;
    const hasMore = rawRows.length > PAGE_SIZE;
    const formatted = hasMore ? rawRows.slice(0, PAGE_SIZE) : rawRows;

    updateMessage(assistantMessageId, {
      hasMore,
    });

    if (formatted.length === 0) {
      await suggestFix({
        userQuery: query,
        schemas,
        relevantTables,
        relationships: getRelationshipsMemory(),
        signal,
        guard,
        assistantMessageId,
        updateMessage,
      });
      if (!isActive(guard, signal)) return;
    }

    const queryResultValidation = validateQueryResult({
      rows: formatted,
    });
    if (queryResultValidation) {
      updateMessage(assistantMessageId, {
        error: queryResultValidation,
        queryResult: [],
        loading: false,
      });
      return;
    }

    const executionTime = performance.now() - startTime;

    addFeedbackMemory({
      query,
      generatedSQL: finalQuery,
      outcome: "success",
      timestamp: Date.now(),
    });

    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.log("FEEDBACK MEMORY (SUCCESS):", addFeedbackMemory);
    }
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.log("QUERY AUDIT", {
        query,
        sql: finalQuery,
        rows: formatted.length,
        executionTime,
      });
    }

    updateMessage(assistantMessageId, {
      queryResult: formatted,
      loading: false,
    });

    await updateStoredMessage({
      id: assistantMessageId,
      updates: {
        queryResult: formatted,
        hasMore,
      },
    });

    return formatted;
  } catch (err) {
    const errorMsg = String(err);

    addFeedbackMemory({
      query,
      generatedSQL: baseQuery,
      outcome: "failure",
      error: errorMsg,
      timestamp: Date.now(),
    });

    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.log("FEEDBACK MEMORY (FAILURE):", addFeedbackMemory);
    }
    updateMessage(assistantMessageId, {
      hasMore: false,
    });
    console.error(err);

    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.log("QUERY FAILURE", {
        query,
        sql: finalQuery,
        error: errorMsg,
      });
    }

    const fixedSQL = await recoverFailedQuery({
      query,
      baseQuery,
      errorMsg,
      schemas,
      relevantTables,
      relationships,
      signal,
      guard,
      fixAttemptsRef,
      assistantMessageId,
      updateMessage,
    });
    if (!fixedSQL) {
      updateMessage(assistantMessageId, {
        loading: false,
      });
      return;
    }

    return await runQuery({
      relevantTables,
      sql: fixedSQL,
      query,
      schemas,
      relationships,
      page,
      PAGE_SIZE,
      signal,
      guard,
      fixAttemptsRef,
      assistantMessageId,
      updateMessage,
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
