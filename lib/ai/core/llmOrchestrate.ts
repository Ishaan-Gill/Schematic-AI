import type { ConversationEntry } from "../context/buildConversationContext";
import type { CoreResult } from "./types";

type LLMOrchestrateDecision = {
  intent: "CONVERSATIONAL" | "REASONING" | "DATA_QUERY";
  needsAnalysis: boolean;
};

type LLMOrchestrateArgs = {
  query: string;
  schemas: Record<string, unknown[]>;
  conversationContext: ConversationEntry[];
  turnId: string;
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const llmOrchestrate = async ({
  query,
  schemas,
  conversationContext,
  turnId,
  signal,
  guard,
}: LLMOrchestrateArgs): Promise<CoreResult<LLMOrchestrateDecision>> => {
  if (signal?.aborted || !(guard?.() ?? true)) {
    return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        type: "llm-orchestrate",
        payload: {
          query,
          schemas,
          conversationContext,
        },
        turnId,
      }),
    });
    const data = await res.json();
    if (signal?.aborted || !(guard?.() ?? true)) {
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
        code: "LLM_ORCHESTRATE_FAILED",
        error:
          errMessage ??
          "Something went wrong deciding how to handle your request. Please try again.",
      };
    }

    return { ok: true, data: data as LLMOrchestrateDecision };
  } catch (err) {
    if (signal?.aborted) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }
    console.error("LLM orchestrator decision failed:", err);

    return {
      ok: false,
      cancelled: false,
      code: "LLM_ORCHESTRATE_ERROR",
      error:
        "Something went wrong deciding how to handle your request. Please try again.",
    };
  }
};
