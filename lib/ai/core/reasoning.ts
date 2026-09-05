// Client-side orchestrator (calls /api/* over fetch — safe for client components).
import { getDuckConnection } from "@/lib/duckdb/duckdb";
import { buildSQLContext } from "../context/buildSQLContext";
import type { ConversationEntry } from "../context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import { isActive } from "@/lib/ai/isActive";
import type { CoreResult } from "./types";

type ReasoningArgs = {
  query: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  conversationContext?: ConversationEntry[];
  turnId: string;
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const reasoning = async ({
  query,
  schemas,
  relationships,
  conversationContext,
  turnId,
  signal,
  guard,
}: ReasoningArgs): Promise<CoreResult<string>> => {
  if (!isActive(guard, signal)) {
    return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
  }

  try {
    const conn = await getDuckConnection();

    if (!isActive(guard, signal)) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }

    const { finalDatasetContext } = await buildSQLContext({
      conn,
      tables: Object.keys(schemas),
      schemas,
    });

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        type: "reasoning",
        payload: {
          query,
          schemas,
          relationships,
          finalDatasetContext,
          conversationContext: conversationContext ?? [],
        },
        turnId,
      }),
    });
    const data = await res.json();
    if (!isActive(guard, signal)) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }

    if (!res.ok) {
      return {
        ok: false,
        cancelled: false,
        code: "REASONING_FAILED",
        error:
          typeof data.error === "string"
            ? data.error
            : "Something went wrong reasoning about your request. Please try again.",
      };
    }

    return { ok: true, data: data.response as string };
  } catch (err) {
    if (signal?.aborted) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }
    console.error("Reasoning failed:", err);

    return {
      ok: false,
      cancelled: false,
      code: "REASONING_ERROR",
      error:
        "Something went wrong reasoning about your request. Please try again.",
    };
  }
};
