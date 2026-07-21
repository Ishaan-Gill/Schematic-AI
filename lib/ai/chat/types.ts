import { FeedbackItem } from "@/lib/upload/metadata/feedbackMemory";
import { Relationship } from "../context/relationships";

export type GenerateRequest = {
    query: string;
    schemas: Record<string, any[]>;
    relationships: Relationship[];
    finalDatasetContext: Record<string, any>;
    feedbackMemory?: FeedbackItem[];
    messages?: any[];
  };
  
  export type AnalysisRequest = {
    query: string;
    sql: string;
    result: Record<string, unknown>[];
    schemas: Record<string, any[]>;
    relationships: Relationship[];
    relevantTables?: string[];
    datasetContext?: Record<string, any>;
  };
  
  export type ChatRequest =
    | {
        type: "generate";
        payload: GenerateRequest;
      }
    | {
        type: "analysis";
        payload: AnalysisRequest;
      };
  
  export type DataQueryResponse = {
    type: "DATA_QUERY";
    thinking: string;
    sql: string;
    relevantTables: string[];
    datasetContext: Record<string, any>;
  };
  
  export type AnalysisResponse = {
    type: "ANALYSIS";
    analysis: string;
  };
  
  export type ConversationalResponse = {
    type: "CONVERSATIONAL";
    response: string;
  };
  
  export type ReasoningResponse = {
    type: "REASONING";
    response: string;
  };
  
  export type AmbiguousResponse = {
    type: "AMBIGUOUS";
    response: string;
  };
  
  export type ChatResponse =
    | DataQueryResponse
    | AnalysisResponse
    | ConversationalResponse
    | ReasoningResponse
    | AmbiguousResponse;