import { ConversationEntry } from "../context/buildConversationContext";
import type { Relationship } from "../context/relationships";

export type TurnContext = {
  query: string;
  conversationContext: ConversationEntry[];
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  relevantTables: string[];
  finalDatasetContext: Record<string, any>;
  warnings: string[];
  normalizationNotes: string[];
};

export type TurnRuntime = {
  sql?: string;
  result?: Record<string, unknown>[];
  error?: string;
  attempts: number;
};

export type ToolResult<T = unknown> = {
  tool: string;
  ok: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  action?: "continue" | "retry" | "stop";
  error?: {
    code: string;
    message: string;
  };
};
