// Client-side orchestrator (calls /api/* over fetch — safe for client components).
import type { ConversationEntry } from "../context/buildConversationContext";
import { isActive } from "@/lib/ai/isActive";
import type { CoreResult } from "./types";

type conversationalArgs = {
  query: string;
  conversationContext?: ConversationEntry[];
  turnId: string;
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const conversational = async ({
  query,
  conversationContext,
  turnId,
  signal,
  guard,
}: conversationalArgs): Promise<CoreResult<string>> => {
  if (!isActive(guard, signal)) {
    return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        type: "conversation",
        payload: { query, conversationContext: conversationContext ?? [] },
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
        code: "CONVERSATIONAL_FAILED",
        error:
          typeof data.error === "string"
            ? data.error
            : "Something went wrong answering your request. Please try again.",
      };
    }

    return { ok: true, data: data.response as string };
  } catch (err) {
    if (signal?.aborted) {
      return { ok: false, cancelled: true, code: "REQUEST_CANCELLED" };
    }
    console.error("Conversational failed:", err);

    return {
      ok: false,
      cancelled: false,
      code: "CONVERSATIONAL_ERROR",
      error:
        "Something went wrong answering your request. Please try again.",
    };
  }
};
