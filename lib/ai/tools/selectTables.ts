import {
  detectTableRelevance,
  expandRelevantTables,
} from "@/lib/ai/context/detectTableRelevance";
import type { TurnContext, ToolResult } from "../orchestrator/types";

export const selectTables = (context: TurnContext): ToolResult<string[]> => {
  const relevantTables = detectTableRelevance(context.query, context.schemas);

  const expandedTables = expandRelevantTables(
    relevantTables,
    context.relationships,
  );

  return {
    tool: "select-tables",
    ok: true,
    data: expandedTables,
    action: "continue",
  };
};
