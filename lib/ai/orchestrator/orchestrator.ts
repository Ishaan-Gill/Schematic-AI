import { getDuckConnection } from "@/lib/duckdb/duckdb";
import { buildContextTool } from "../tools/buildContext";
import { selectTables } from "../tools/selectTables";
import { TurnContext, TurnRuntime } from "./types";
import { generateSQL } from "../chat/generate";

export const orchestrate = async (
  context: TurnContext,
  runtime: TurnRuntime,
) => {
  const conn = await getDuckConnection();

  // 1. Select Relevant Tables:
  const result = selectTables(context);
  if (!result.ok) {
    return result;
  }
  context.relevantTables = result.data ?? [];

  // 2. Get richer context:
  const contextResult = await buildContextTool(context, conn);
  if (!contextResult.ok) {
    return contextResult;
  }

  // 3. Generate SQL:
  const sqlResult = await generateSQL({
    query: context.query,
    schemas: context.schemas,
    relevantTables: context.relevantTables,
    relationships: context.relationships,
    finalDatasetContext: context.finalDatasetContext,
    conversationContext: context.conversationContext,
  });
  if (!sqlResult.ok) {
    return sqlResult;
  }

  runtime.sql = sqlResult.data.sql;

  return sqlResult;
};
