import { getDuckConnection } from "@/lib/duckdb/duckdb";
import { buildContextTool } from "../tools/buildContext";
import { selectTables } from "../tools/selectTables";
import { TurnContext, TurnRuntime } from "./types";
import { generateSQL } from "../chat/generate";
import { verifySQL } from "../tools/verifySQL";
import { executeSQL } from "../tools/executeSQL";
import { fixSQL } from "../tools/fixSQL";

export const orchestrate = async (
  context: TurnContext,
  runtime: TurnRuntime,
  signal?: AbortSignal,
  guard?: () => boolean,
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

  // 4. Verify SQL:
  const verifyResult = await verifySQL(runtime);
  if (!verifyResult.ok) {
    return verifyResult;
  }

  // 5. Execute SQL
  const executeResult = await executeSQL({
    runtime,
    signal,
    guard,
  });

  if (executeResult.ok) {
    return executeResult;
  }

  // 6. Execution failed → fix SQL
  const fixResult = await fixSQL({
    context,
    runtime,
    error: executeResult.error.message,
  });

  if (!fixResult.ok) {
    return fixResult;
  }

  // 7. Use fixed SQL
  runtime.sql = fixResult.data.sql;

  // 8. Verify fixed SQL
  const fixedVerifyResult = await verifySQL(runtime);

  if (!fixedVerifyResult.ok) {
    return fixedVerifyResult;
  }

  // 9. Execute fixed SQL
  return await executeSQL({
    runtime,
    signal,
    guard,
  });
};
