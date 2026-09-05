// Client-side gate shared by the initial and repaired SQL paths:
// shared safety verification (verifySQL) followed by the workspace schema
// allowlist. Returns an error result when the SQL must not execute, or null
// when it may proceed. Reuses the canonical SQL utilities — this module adds
// no new validation rules.

import type { ToolResult, TurnRuntime } from "./types";
import { verifySQL } from "../tools/verifySQL";
import { validateAgainstSchema } from "@/lib/sql/validateSchema";

export async function verifyGeneratedSql(
  runtime: TurnRuntime,
  schemas: Record<string, unknown[]>,
): Promise<Extract<ToolResult<null>, { ok: false }> | null> {
  const verifyResult = await verifySQL(runtime);
  if (!verifyResult.ok) return verifyResult;

  // Reject hallucinated tables/columns (including cached SQL) before
  // execution. Conservative — valid analytical SQL passes through.
  const schemaError = validateAgainstSchema(runtime.sql, schemas);
  if (schemaError) {
    const code = schemaError.includes("column")
      ? "COLUMN_NOT_FOUND"
      : "TABLE_NOT_FOUND";
    return {
      tool: "verify-sql",
      ok: false,
      action: "retry",
      error: { code, message: schemaError },
    };
  }

  return null;
}
