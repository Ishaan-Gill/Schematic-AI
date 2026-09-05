import { DEBUG } from "@/lib/config/debug";
import type { ToolResult, TurnRuntime } from "../core/types";

import { getDuckConnection, resetDuckConnection } from "@/lib/duckdb/duckdb";
import { ensureWorkspaceFresh } from "@/lib/duckdb/ensureWorkspaceFresh";
import { buildExecutableSQL } from "@/lib/sql/buildExecutableSQL";
import { validateQueryResult } from "@/lib/sql/validateQueryResult";
import { checkSQLSafetySync } from "@/lib/sql/sqlSafety";
import { isActive } from "@/lib/ai/isActive";

type ExecuteSQLArgs = {
  runtime: TurnRuntime;
  page?: number;
  PAGE_SIZE?: number;
  signal?: AbortSignal;
  guard?: () => boolean;
};

type ExecuteSQLData = {
  rows: Record<string, unknown>[];
  hasMore: boolean;
  executionTime: number;
};

export async function executeSQL({
  runtime,
  page = 0,
  PAGE_SIZE = 100,
  signal,
  guard,
}: ExecuteSQLArgs): Promise<ToolResult<ExecuteSQLData>> {
  const startTime = performance.now();

  if (!isActive(guard, signal)) {
    return {
      tool: "execute-sql",
      ok: false,
      action: "stop",
      error: {
        code: "REQUEST_CANCELLED",
        message: "Request cancelled.",
      },
    };
  }

  const sql = runtime.sql;

  if (!sql) {
    return {
      tool: "execute-sql",
      ok: false,
      action: "stop",
      error: {
        code: "NO_SQL",
        message: "No SQL query is available to execute.",
      },
    };
  }

  // Defense-in-depth: never execute without validation, even if a caller
  // forgets to call verifySQL/validateSQL first.
  const safetyError = checkSQLSafetySync(sql);
  if (safetyError) {
    return {
      tool: "execute-sql",
      ok: false,
      action: "stop",
      error: {
        code: "DANGEROUS_SQL",
        message: safetyError,
      },
    };
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const TIMEOUT_MS = 8000;

  try {
    const { finalQuery } = buildExecutableSQL({
      sql,
      page,
      PAGE_SIZE,
    });

    if (!isActive(guard, signal)) {
      return {
        tool: "execute-sql",
        ok: false,
        action: "stop",
        error: {
          code: "REQUEST_CANCELLED",
          message: "Request cancelled.",
        },
      };
    }

    const conn = await getDuckConnection();

    await ensureWorkspaceFresh(conn);

    if (!isActive(guard, signal)) {
      return {
        tool: "execute-sql",
        ok: false,
        action: "stop",
        error: {
          code: "REQUEST_CANCELLED",
          message: "Request cancelled.",
        },
      };
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Query timeout"));
      }, TIMEOUT_MS);
    });

    const reader = await conn.send(finalQuery);

    const collectPromise = (async (): Promise<Record<string, unknown>[]> => {
      const rows: Record<string, unknown>[] = [];

      for await (const batch of reader) {
        const batchRows = batch.toArray();

        for (let i = 0; i < batchRows.length; i++) {
          rows.push({
            ...(batchRows[i] as Record<string, unknown>),
          });
        }
      }

      return rows;
    })();

    // Prevent an unhandled rejection if timeout wins the race.
    void collectPromise.catch(() => {});

    let rawRows: Record<string, unknown>[];

    try {
      rawRows = await Promise.race([
        collectPromise,
        timeoutPromise,
      ]);
    } catch (err) {
      if ((err as Error)?.message === "Query timeout") {
        try {
          const cancelled = await conn.cancelSent();

          if (!cancelled) {
            await resetDuckConnection();
          }
        } catch (cancelError) {
          console.error(
            "Failed to cancel/reset DuckDB query:",
            cancelError,
          );
        }
      }

      throw err;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!isActive(guard, signal)) {
      return {
        tool: "execute-sql",
        ok: false,
        action: "stop",
        error: {
          code: "REQUEST_CANCELLED",
          message: "Request cancelled.",
        },
      };
    }

    const hasMore = rawRows.length > PAGE_SIZE;

    const rows = hasMore
      ? rawRows.slice(0, PAGE_SIZE)
      : rawRows;

    const resultValidationError = validateQueryResult({
      rows,
    });

    if (resultValidationError) {
      return {
        tool: "execute-sql",
        ok: false,
        action: "stop",
        error: {
          code: "QUERY_RESULT_INVALID",
          message: resultValidationError,
        },
      };
    }

    const executionTime = performance.now() - startTime;

    if (DEBUG) {
      console.log("QUERY AUDIT", {
        sql: finalQuery,
        rows: rows.length,
        hasMore,
        executionTime,
      });
    }

    runtime.result = rows;

    return {
      tool: "execute-sql",
      ok: true,
      data: {
        rows,
        hasMore,
        executionTime,
      },
      action: "continue",
    };
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (signal?.aborted) {
      return {
        tool: "execute-sql",
        ok: false,
        action: "stop",
        error: {
          code: "REQUEST_CANCELLED",
          message: "Request cancelled.",
        },
      };
    }

    console.error("execute-sql failed:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    if (errorMessage === "Query timeout") {
      return {
        tool: "execute-sql",
        ok: false,
        action: "retry",
        error: {
          code: "QUERY_TIMEOUT",
          message: "The query took too long to execute.",
        },
      };
    }

    return {
      tool: "execute-sql",
      ok: false,
      action: "retry",
      error: {
        code: "SQL_EXECUTION_FAILED",
        message: "Failed to execute SQL query.",
      },
      meta: { rawError: errorMessage },
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}