import { buildSQLContext } from "@/lib/ai/context/buildSQLContext";
import type { TurnContext, ToolResult } from "../core/types";
import { DuckConnection } from "@/types/duckdb";

export async function buildContextTool(
  context: TurnContext,
  conn: DuckConnection,
): Promise<ToolResult<unknown>> {
  try {
    const result = await buildSQLContext({
      conn,
      tables: context.relevantTables,
      schemas: context.schemas,
    });

    context.finalDatasetContext = result.finalDatasetContext;

    return {
      tool: "build-context",
      ok: true,
      data: result,
      action: "continue",
    };
  } catch (error) {
    // Never surface DuckDB/storage internals (paths, engine errors) to the UI.
    console.error("Dataset context build failed:", error);
    return {
      tool: "build-context",
      ok: false,
      action: "stop",
      error: {
        code: "CONTEXT_BUILD_FAILED",
        message: "Couldn't prepare your dataset for analysis. Please try again.",
      },
    };
  }
}
