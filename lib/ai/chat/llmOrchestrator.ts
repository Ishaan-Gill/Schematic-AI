// Server-only Groq executor (called by app/api/* routes — never import from client components).
import { groq } from "@/lib/ai/client";
import { groqWithRetry } from "@/lib/ai/groqRetry";
import { DEBUG } from "@/lib/config/debug";
import { llmOrchestratorPrompt } from "@/lib/ai/prompts/llm-orchestrator-prompt";
import type { ConversationEntry } from "../context/buildConversationContext";
import type { ToolResult } from "../core/types";

export type LLMOrchestratorDecision = {
  intent: "CONVERSATIONAL" | "REASONING" | "DATA_QUERY";
  needsAnalysis: boolean;
};

const VALID_INTENTS = [
  "CONVERSATIONAL",
  "REASONING",
  "DATA_QUERY",
] as const;

type LLMOrchestrateParams = {
  query: string;
  conversationContext: ConversationEntry[];
  schemas: Record<string, unknown[]>;
  signal?: AbortSignal;
  guard?: () => boolean;
};

const stripCodeFence = (raw: string): string => {
  const trimmed = raw.trim();

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) {
    return fenced[1].trim();
  }

  return trimmed;
};

const parseDecision = (raw: string): LLMOrchestratorDecision | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (!VALID_INTENTS.includes(record.intent as never)) {
    return null;
  }

  if (typeof record.needsAnalysis !== "boolean") {
    return null;
  }

  const decision = {
    intent: record.intent as LLMOrchestratorDecision["intent"],
    needsAnalysis: record.needsAnalysis,
  };

  if (decision.intent !== "DATA_QUERY" && decision.needsAnalysis) {
    return null;
  }

  return decision;
};

export async function llmOrchestrate({
  query,
  conversationContext,
  schemas,
  signal,
  guard,
}: LLMOrchestrateParams): Promise<ToolResult<LLMOrchestratorDecision>> {
  const prompt = llmOrchestratorPrompt({
    query,
    conversationContext,
    schemas,
  });

  const result = await groqWithRetry({
    label: "llm orchestrator",
    signal,
    guard,
    call: () =>
      groq.chat.completions.create(
        {
          model: "openai/gpt-oss-120b",
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content: prompt.system,
            },
            {
              role: "user",
              content: prompt.user,
            },
          ],
        },
        { signal },
      ),
  });

  if (result.status === "cancelled") {
    return {
      tool: "llm-orchestrator",
      ok: false,
      action: "stop",
      error: {
        code: "REQUEST_CANCELLED",
        message: "Request cancelled.",
      },
    };
  }

  if (result.status !== "ok") {
    return {
      tool: "llm-orchestrator",
      ok: false,
      action: "retry",
      error: {
        code: "LLM_ORCHESTRATOR_NO_RESPONSE",
        message: "Something went wrong deciding how to handle your request. Please try again.",
      },
    };
  }

  const completion = result.completion;

  const raw = completion.choices[0]?.message?.content?.trim() || "";

  if (DEBUG) {
    console.log("AI RAW (llm-orchestrator):", raw);
  }

  const decision = parseDecision(raw);

  if (!decision) {
    return {
      tool: "llm-orchestrator",
      ok: false,
      action: "retry",
      error: {
        code: "LLM_ORCHESTRATOR_INVALID_DECISION",
        message: "I couldn't understand your request. Please try rephrasing.",
      },
    };
  }

  return {
    tool: "llm-orchestrator",
    ok: true,
    action: "continue",
    data: decision,
  };
}