import { groq } from "@/lib/ai/client";
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

const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);

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

  let completion;
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (!isActive(guard, signal)) {
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

    try {
      completion = await groq.chat.completions.create(
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
      );
      break;
    } catch (err) {
      if (signal?.aborted) {
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

      console.error(`Groq attempt (llm orchestrator) ${attempt} failed:`, err);

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (!completion) {
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