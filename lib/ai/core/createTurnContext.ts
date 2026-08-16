import type { ConversationEntry } from "../context/buildConversationContext";
import type { Relationship } from "../context/relationships";
import type { TurnContext } from "./types";

type CreateTurnContextParams = {
  query: string;
  conversationContext: ConversationEntry[];
  schemas: Record<string, any[]>;
  relationships: Relationship[];
  finalDatasetContext: Record<string, any>;
  warnings?: string[];
  normalizationNotes?: string[];
};

export const createTurnContext = ({
  query,
  conversationContext,
  schemas,
  relationships,
  finalDatasetContext,
  warnings = [],
  normalizationNotes = [],
}: CreateTurnContextParams): TurnContext => {
  return {
    query,
    conversationContext,
    schemas,
    relationships,
    relevantTables: [],
    finalDatasetContext,
    warnings,
    normalizationNotes,
  };
};