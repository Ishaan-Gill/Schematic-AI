import { getDuckConnection } from "@/lib/duckdb/duckdb";
import { isTimeQuery } from "@/lib/ai/timeQuery";
import type { ConversationEntry } from "@/lib/ai/context/buildConversationContext";
import type { Relationship } from "@/lib/ai/context/relationships";
import { buildContextTool } from "@/lib/ai/tools/buildContext";
import { selectTables } from "@/lib/ai/tools/selectTables";
import { verifySQL } from "@/lib/ai/tools/verifySQL";
import { executeSQL } from "@/lib/ai/tools/executeSQL";
import { createTurnContext } from "@/lib/ai/core/createTurnContext";
import type { ToolResult, TurnRuntime } from "@/lib/ai/core/types";

export type DataQueryResult = {
  sql: string;
  rows: Record<string, unknown>[];
  displayedRowCount: number;
  hasMore: boolean;
  relevantTables: string[];
  finalDatasetContext: Record<string, unknown>;
};

type DataQueryArgs = {
  query: string;
  schemas: Record<string, unknown[]>;
  relationships: Relationship[];
  conversationContext: ConversationEntry[];
  turnId: string;
  finalDatasetContext?: Record<string, unknown>;
  timeHint?: string;
  signal?: AbortSignal;
  guard?: () => boolean;
};

type GenerateAPIResponse = {
  sql?: string;
  error?: string | { code?: string; message?: string };
};

type FixSQLAPIResponse = {
  sql?: string;
  error?: string;
};

const rawError = (result: ToolResult<DataQueryResult>): string | undefined => {
  if (!result.ok && typeof result.meta?.rawError === "string") {
    return result.meta.rawError;
  }
  return undefined;
};

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

const TIME_HINT_TEMPLATE = `
  Time-based analytics query.
  Prefer DATE_TRUNC, EXTRACT, proper date filtering,
  and relative date logic where appropriate.
`;

export const dataQuery = async ({
  query,
  schemas,
  relationships,
  conversationContext,
  turnId,
  finalDatasetContext = {},
  timeHint,
  signal,
  guard,
}: DataQueryArgs): Promise<ToolResult<DataQueryResult>> => {
  const context = createTurnContext({
    query,
    conversationContext,
    schemas,
    relationships,
    finalDatasetContext,
  });

  const runtime: TurnRuntime = { attempts: 0 };

  const cancelled: ToolResult<DataQueryResult> = {
    tool: "data-query",
    ok: false,
    action: "stop",
    error: {
      code: "REQUEST_CANCELLED",
      message: "Request cancelled.",
    },
  };

  // 1. Select relevant tables:
  if (!isActive(guard, signal)) return cancelled;

  const selectResult = selectTables(context);
  if (!selectResult.ok) return selectResult;
  context.relevantTables = selectResult.data;

  // 2. Build richer context:
  if (!isActive(guard, signal)) return cancelled;

  const conn = await getDuckConnection();
  const contextResult = await buildContextTool(context, conn);
  if (!contextResult.ok) return contextResult;

  // 3. Generate SQL via HTTP:
  if (!isActive(guard, signal)) return cancelled;

  const finalTimeHint =
    timeHint ?? (isTimeQuery(query) ? TIME_HINT_TEMPLATE : "");

  let data: GenerateAPIResponse;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        type: "generate",
        payload: {
          query,
          schemas,
          relevantTables: context.relevantTables,
          relationships,
          finalDatasetContext: context.finalDatasetContext,
          conversationContext,
          timeHint: finalTimeHint,
        },
        turnId,
      }),
    });

    data = (await res.json()) as GenerateAPIResponse;

    if (!isActive(guard, signal)) return cancelled;

    if (!res.ok) {
      const code =
        typeof data.error === "object" &&
        data.error !== null &&
        typeof data.error.code === "string"
          ? data.error.code
          : "SQL_GENERATION_FAILED";
      const message =
        typeof data.error === "object" &&
        data.error !== null &&
        typeof data.error.message === "string"
          ? data.error.message
          : typeof data.error === "string"
            ? data.error
            : "Something went wrong generating your query. Please try again.";

      return {
        tool: "generate-sql",
        ok: false,
        action: code === "INVALID_QUERY" ? "stop" : "retry",
        error: { code, message },
      };
    }

    if (typeof data.sql !== "string" || !data.sql.trim()) {
      return {
        tool: "generate-sql",
        ok: false,
        action: "retry",
        error: {
          code: "SQL_GENERATION_FAILED",
          message:
            "Something went wrong generating your query. Please try again.",
        },
      };
    }

    runtime.sql = data.sql.trim();
  } catch (err) {
    if (signal?.aborted) return cancelled;
    console.error("data-query generate failed:", err);

    return {
      tool: "generate-sql",
      ok: false,
      action: "retry",
      error: {
        code: "GENERATE_SQL_ERROR",
        message:
          "Something went wrong generating your query. Please try again.",
      },
    };
  }

  // 4. Verify SQL:
  if (!isActive(guard, signal)) return cancelled;

  const verifyResult = await verifySQL(runtime);
  if (!verifyResult.ok) return verifyResult;

  // 5. Execute SQL:
  const executeResult = await executeSQL({ runtime, signal, guard });
  if (executeResult.ok) {
    return {
      tool: "data-query",
      ok: true,
      action: "continue",
      data: {
        sql: runtime.sql!,
        rows: executeResult.data.rows,
        displayedRowCount: executeResult.data.rows.length,
        hasMore: executeResult.data.hasMore,
        relevantTables: context.relevantTables,
        finalDatasetContext: context.finalDatasetContext,
      },
    };
  }

  // 6. Execution failed → fix SQL via HTTP:
  if (!isActive(guard, signal)) return cancelled;

  let fixedSQL: string;

  try {
    const fixRes = await fetch("/api/fix-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        userQuery: query,
        failedSql: runtime.sql,
        error: executeResult.error.message,
        rawError: rawError(executeResult),
        schemas,
        relationships,
        turnId,
      }),
    });

    const fixData = (await fixRes.json()) as FixSQLAPIResponse;

    if (!isActive(guard, signal)) return cancelled;

    if (!fixRes.ok) {
      return {
        tool: "fix-sql",
        ok: false,
        action: "retry",
        error: {
          code: "SQL_FIX_FAILED",
          message:
            typeof fixData.error === "string"
              ? fixData.error
              : "AI could not generate a fixed SQL query.",
        },
      };
    }

    if (typeof fixData.sql !== "string" || !fixData.sql.trim()) {
      return {
        tool: "fix-sql",
        ok: false,
        action: "retry",
        error: {
          code: "SQL_FIX_FAILED",
          message: "AI could not generate a fixed SQL query.",
        },
      };
    }

    fixedSQL = fixData.sql.trim();
  } catch (err) {
    if (signal?.aborted) return cancelled;
    console.error("data-query fix-sql failed:", err);

    return {
      tool: "fix-sql",
      ok: false,
      action: "retry",
      error: {
        code: "FIX_SQL_ERROR",
        message: "Something went wrong while fixing the SQL.",
      },
    };
  }

  // 7. Use fixed SQL:
  runtime.sql = fixedSQL;

  // 8. Verify fixed SQL:
  if (!isActive(guard, signal)) return cancelled;

  const fixedVerifyResult = await verifySQL(runtime);
  if (!fixedVerifyResult.ok) return fixedVerifyResult;

  // 9. Execute fixed SQL:
  const fixedExecuteResult = await executeSQL({ runtime, signal, guard });
  if (!fixedExecuteResult.ok) return fixedExecuteResult;

  return {
    tool: "data-query",
    ok: true,
    action: "continue",
    data: {
      sql: runtime.sql!,
      rows: fixedExecuteResult.data.rows,
      displayedRowCount: fixedExecuteResult.data.rows.length,
      hasMore: fixedExecuteResult.data.hasMore,
      relevantTables: context.relevantTables,
      finalDatasetContext: context.finalDatasetContext,
    },
  };
};
