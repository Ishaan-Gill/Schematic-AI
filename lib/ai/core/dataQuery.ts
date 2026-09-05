import { getDuckConnection } from "@/lib/duckdb/duckdb";
import {
  getCurrentDateHint,
  getLocalDateString,
  getRelativeWindowHint,
  isTimeQuery,
} from "@/lib/ai/timeQuery";
import type { ConversationEntry } from "@/lib/ai/context/buildConversationContext";
import type { Relationship } from "@/lib/ai/context/relationships";
import { buildContextTool } from "@/lib/ai/tools/buildContext";
import { selectTables } from "@/lib/ai/tools/selectTables";
import { executeSQL } from "@/lib/ai/tools/executeSQL";
import { verifyGeneratedSql } from "@/lib/ai/core/verifyQuery";
import {
  fetchFixedSql,
  fetchGeneratedSql,
} from "@/lib/ai/core/queryTransport";
import { createTurnContext } from "@/lib/ai/core/createTurnContext";
import type { ToolResult, TurnRuntime } from "@/lib/ai/core/types";
import { normalizeQuery } from "@/lib/cache/normalizeQuery";
import { schemaHash } from "@/lib/cache/schemaHash";
import { buildCacheKey } from "@/lib/cache/buildCacheKey";
import { getCachedSQL, saveCachedSQL } from "@/lib/cache/queryCache";
import { isActive } from "@/lib/ai/isActive";
import {
  MAX_CONTEXT_COLUMNS,
  MAX_CONTEXT_TABLES,
} from "@/lib/ai/context/contextLimits";

export type DataQueryResult = {
  sql: string;
  rows: Record<string, unknown>[];
  displayedRowCount: number;
  hasMore: boolean;
  relevantTables: string[];
  finalDatasetContext: Record<string, unknown>;
  warnings: string[];
};

type DataQueryArgs = {
  query: string;
  schemas: Record<string, unknown[]>;
  relationships: Relationship[];
  conversationContext: ConversationEntry[];
  turnId: string;
  finalDatasetContext?: Record<string, unknown>;
  timeHint?: string;
  userId?: string | null;
  signal?: AbortSignal;
  guard?: () => boolean;
};

const rawError = (result: ToolResult<DataQueryResult>): string | undefined => {
  if (!result.ok && typeof result.meta?.rawError === "string") {
    return result.meta.rawError;
  }
  return undefined;
};

/**
 * Mirrors the server-side truncation in generate.ts (same shared limits).
 * Warns instead of silently dropping tables/columns from the AI's context.
 */
const buildContextWarnings = (
  relevantTables: string[],
  schemas: Record<string, unknown[]>,
): string[] => {
  const warnings: string[] = [];

  if (relevantTables.length > MAX_CONTEXT_TABLES) {
    warnings.push(
      `Large workspace: only the first ${MAX_CONTEXT_TABLES} of ${relevantTables.length} relevant tables were sent to the AI. Mention specific table names in your question for best results.`,
    );
  }

  const overflowTables = relevantTables
    .slice(0, MAX_CONTEXT_TABLES)
    .filter((table) => (schemas[table]?.length ?? 0) > MAX_CONTEXT_COLUMNS);
  if (overflowTables.length > 0) {
    const shown = overflowTables.slice(0, 3).join(", ");
    const more =
      overflowTables.length > 3
        ? ` and ${overflowTables.length - 3} more`
        : "";
    warnings.push(
      `Wide tables (${shown}${more}): only the first ${MAX_CONTEXT_COLUMNS} columns of each were sent to the AI.`,
    );
  }

  return warnings;
};

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
  userId,
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

  // 3. Generate SQL via HTTP (query cache short-circuits the LLM):
  if (!isActive(guard, signal)) return cancelled;

  const normalizedQuery = normalizeQuery(query);
  const relevantSchemas = Object.fromEntries(
    Object.entries(schemas).filter(([tableName]) =>
      context.relevantTables.includes(tableName),
    ),
  );
  const hash = await schemaHash(relevantSchemas);
  const cacheKey = buildCacheKey({
    normalizedQuery,
    schemaHash: hash,
    dateBucket: isTimeQuery(query) ? getLocalDateString() : undefined,
    userId: userId ?? undefined,
  });

  const cachedSQL = await getCachedSQL(cacheKey);
  if (!isActive(guard, signal)) return cancelled;

  if (cachedSQL) {
    runtime.sql = cachedSQL;
  } else {
    const finalTimeHint =
      timeHint ??
      [
        getCurrentDateHint(),
        ...(isTimeQuery(query) ? [TIME_HINT_TEMPLATE] : []),
        getRelativeWindowHint(query),
      ]
        .filter(Boolean)
        .join("\n");

    const generateResult = await fetchGeneratedSql({
      query,
      schemas,
      relevantTables: context.relevantTables,
      relationships,
      finalDatasetContext: context.finalDatasetContext,
      conversationContext,
      timeHint: finalTimeHint,
      turnId,
      signal,
      guard,
    });

    if (!generateResult.ok) return generateResult;

    runtime.sql = generateResult.data;
  }

  // 4. Verify SQL (shared safety + schema allowlist gate):
  if (!isActive(guard, signal)) return cancelled;

  const gateFailure = await verifyGeneratedSql(runtime, schemas);
  if (gateFailure) return gateFailure;

  // 5. Execute SQL:
  const executeResult = await executeSQL({ runtime, signal, guard });
  if (executeResult.ok) {
    await saveCachedSQL({
      cacheKey,
      normalizedQuery,
      schemaHash: hash,
      sql: runtime.sql!,
    });
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
        warnings: buildContextWarnings(context.relevantTables, schemas),
      },
    };
  }

  // 6. Execution failed → fix SQL via HTTP:
  if (!isActive(guard, signal)) return cancelled;

  const fixResult = await fetchFixedSql({
    userQuery: query,
    failedSql: runtime.sql,
    errorMessage: executeResult.error.message,
    rawError: rawError(executeResult),
    schemas,
    relationships,
    currentDateHint: getCurrentDateHint(),
    turnId,
    signal,
    guard,
  });

  if (!fixResult.ok) return fixResult;

  // 7. Use fixed SQL:
  runtime.sql = fixResult.data;

  // 8. Verify fixed SQL:
  if (!isActive(guard, signal)) return cancelled;

  const fixedGateFailure = await verifyGeneratedSql(runtime, schemas);
  if (fixedGateFailure) return fixedGateFailure;

  // 9. Execute fixed SQL:
  const fixedExecuteResult = await executeSQL({ runtime, signal, guard });
  if (!fixedExecuteResult.ok) return fixedExecuteResult;

  await saveCachedSQL({
    cacheKey,
    normalizedQuery,
    schemaHash: hash,
    sql: runtime.sql!,
  });

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
      warnings: buildContextWarnings(context.relevantTables, schemas),
    },
  };
};
