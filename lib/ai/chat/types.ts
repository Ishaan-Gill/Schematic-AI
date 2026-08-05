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

export type AnalysisRequest = {
  query: string;
  sql: string;
  result: Record<string, unknown>[];
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  relevantTables?: string[];
  datasetContext?: Record<string, any>;
  normalizationNotes?: string[];
  warnings?: string[];
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

export type AmbiguousRequest = {
  query: string;
};

export type ClassifyIntentRequest = {
  query: string;
  schemas: Record<string, any[]>;
};

export type ChatRequest =
  | {
      type: "generate";
      payload: GenerateRequest;
    }
  | {
      type: "analysis";
      payload: AnalysisRequest;
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
      type: "ambiguous";
      payload: AmbiguousRequest;
    }
  | {
      type: "classify-intent";
      payload: ClassifyIntentRequest;
    };

export type DataQueryResponse = {
  type: "DATA_QUERY";
  sql: string;
  relevantTables: string[];
  datasetContext: Record<string, any>;
};

export type ChatResponse =
  | DataQueryResponse
  | { response: string };