import { getDuckConnection } from "@/lib/duckdb/duckdb";
import { buildSQLContext } from "../context/buildSQLContext";
import type { Relationship } from "../context/relationships";
import type { CoreResult } from "./types";

type ReasoningArgs = {
  query: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  turnId: string;
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const reasoning = async ({
  query,
  schemas,
  relationships,
  turnId,
  signal,
  guard,
}: ReasoningArgs): Promise<CoreResult<string>> => {
  if (signal?.aborted || !(guard?.() ?? true)) {
    return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
  }

  try {
    const conn = await getDuckConnection();

    if (signal?.aborted || !(guard?.() ?? true)) {
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
        },
        turnId,
      }),
    });
    const data = await res.json();
    if (signal?.aborted || !(guard?.() ?? true)) {
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
