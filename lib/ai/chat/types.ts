import { Relationship } from "../context/relationships";
import { ConversationEntry } from "../context/buildConversationContext";

export type GenerateRequest = {
  query: string;
  schemas: Record<string, any[]>;
  relevantTables: string[];
  relationships: Relationship[];
  finalDatasetContext: Record<string, any>;
  conversationContext?: ConversationEntry[];
  timeHint: string;
};

export type ConversationRequest = {
  query: string;
};

export type ReasoningRequest = {
  query: string;
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  finalDatasetContext: Record<string, any>;
};

export type LLMOrchestrateRequest = {
  query: string;
  schemas: Record<string, unknown[]>;
  conversationContext: ConversationEntry[];
};

export type DataAnalysisRequest = {
  query: string;
  sql: string;
  result: Record<string, unknown>[];
  displayedRowCount: number;
  hasMore: boolean;
  schemas: Record<string, unknown[]>;
  relevantTables: string[];
  relationships: Relationship[];
  datasetContext: Record<string, unknown>;
  conversationContext: ConversationEntry[];
  warnings?: string[];
  normalizationNotes?: string[];
};

export type ChatRequest = (
  | {
      type: "generate";
      payload: GenerateRequest;
    }
  | {
      type: "conversation";
      payload: ConversationRequest;
    }
  | {
      type: "reasoning";
      payload: ReasoningRequest;
    }
  | {
      type: "llm-orchestrate";
      payload: LLMOrchestrateRequest;
    }
  | {
      type: "data-analysis";
      payload: DataAnalysisRequest;
    }
) & {
  turnId?: string;
};

export type LLMOrchestrateResponse = {
  intent: "CONVERSATIONAL" | "REASONING" | "DATA_QUERY";
  needsAnalysis: boolean;
};

export type DataQueryResponse = {
  type: "DATA_QUERY";
  sql: string;
  relevantTables: string[];
  datasetContext: Record<string, any>;
};

export type ChatResponse =
  | DataQueryResponse
  | LLMOrchestrateResponse
  | { response: string }
  | { analysis: string };
