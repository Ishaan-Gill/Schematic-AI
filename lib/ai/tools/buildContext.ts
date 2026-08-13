import { buildSQLContext } from "@/lib/ai/context/buildSQLContext";
import type { TurnContext, ToolResult } from "../orchestrator/types";
import { DuckConnection } from "@/types/duckdb";

export async function buildContextTool(
  context: TurnContext,
  conn: DuckConnection,
): Promise<ToolResult> {
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
    return {
      tool: "build-context",
      ok: false,
      action: "stop",
      error: {
        code: "CONTEXT_BUILD_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to build dataset context.",
      },
    };
  }
}
