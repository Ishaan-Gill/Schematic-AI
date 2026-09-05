// Client-side transport for the remote SQL endpoints (/api/chat generate,
// /api/fix-sql). Owns only the HTTP mechanics — request shape, cancellation
// checks, error mapping, and logging. Safety validation and execution stay
// with the verify/execute stages in dataQuery.

import type { ConversationEntry } from "../context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import type { ToolResult } from "./types";
import { isActive } from "@/lib/ai/isActive";

type GenerateAPIResponse = {
  sql?: string;
  error?: string | { code?: string; message?: string };
};

type FixSQLAPIResponse = {
  sql?: string;
  error?: string;
};

type TransportBase = {
  turnId: string;
  signal?: AbortSignal;
  guard?: () => boolean;
};

type FetchGeneratedSqlArgs = TransportBase & {
  query: string;
  schemas: Record<string, unknown[]>;
  relevantTables: string[];
  relationships: Relationship[];
  finalDatasetContext: Record<string, unknown>;
  conversationContext: ConversationEntry[];
  timeHint: string;
};

type FetchFixedSqlArgs = TransportBase & {
  userQuery: string;
  failedSql: string | undefined;
  errorMessage: string;
  rawError: string | undefined;
  schemas: Record<string, unknown[]>;
  relationships: Relationship[];
  currentDateHint: string;
};

const cancelled = <T>(tool: string): ToolResult<T> => ({
  tool,
  ok: false,
  action: "stop",
  error: {
    code: "REQUEST_CANCELLED",
    message: "Request cancelled.",
  },
});

export async function fetchGeneratedSql({
  query,
  schemas,
  relevantTables,
  relationships,
  finalDatasetContext,
  conversationContext,
  timeHint,
  turnId,
  signal,
  guard,
}: FetchGeneratedSqlArgs): Promise<ToolResult<string>> {
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
          relevantTables,
          relationships,
          finalDatasetContext,
          conversationContext,
          timeHint,
        },
        turnId,
      }),
    });

    data = (await res.json()) as GenerateAPIResponse;

    if (!isActive(guard, signal)) return cancelled("generate-sql");

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

    return { tool: "generate-sql", ok: true, data: data.sql.trim() };
  } catch (err) {
    if (signal?.aborted) return cancelled("generate-sql");
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
}

export async function fetchFixedSql({
  userQuery,
  failedSql,
  errorMessage,
  rawError,
  schemas,
  relationships,
  currentDateHint,
  turnId,
  signal,
  guard,
}: FetchFixedSqlArgs): Promise<ToolResult<string>> {
  try {
    const fixRes = await fetch("/api/fix-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        userQuery,
        failedSql,
        error: errorMessage,
        rawError,
        schemas,
        relationships,
        currentDateHint,
        turnId,
      }),
    });

    const fixData = (await fixRes.json()) as FixSQLAPIResponse;

    if (!isActive(guard, signal)) return cancelled("fix-sql");

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

    return { tool: "fix-sql", ok: true, data: fixData.sql.trim() };
  } catch (err) {
    if (signal?.aborted) return cancelled("fix-sql");
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
}
