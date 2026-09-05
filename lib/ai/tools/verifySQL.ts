import { getDuckConnection } from "@/lib/duckdb/duckdb";
import type { TurnRuntime, ToolResult } from "../core/types";
import { ensureWorkspaceFresh } from "@/lib/duckdb/ensureWorkspaceFresh";
import { checkSQLSafetySync } from "@/lib/sql/sqlSafety";

export async function verifySQL(
  runtime: TurnRuntime,
): Promise<ToolResult<null>> {
  const sql = runtime.sql;

  if (!sql || typeof sql !== "string") {
    return {
      tool: "verify-sql",
      ok: false,
      action: "stop",
      error: {
        code: "NO_SQL",
        message: "No SQL query is available to verify.",
      },
    };
  }

  const fail = (code: string, message: string): ToolResult<null> => ({
    tool: "verify-sql",
    ok: false,
    action: "retry",
    error: { code, message },
  });

  const safetyError = checkSQLSafetySync(sql);
  if (safetyError) {
    const code = safetyError.startsWith("Dangerous SQL")
      ? "DANGEROUS_SQL"
      : safetyError.startsWith("Only SELECT")
        ? "INVALID_SQL_TYPE"
        : safetyError.startsWith("Multiple SQL")
          ? "MULTIPLE_STATEMENTS"
          : safetyError.startsWith("External file")
            ? "DANGEROUS_SQL"
            : "DANGEROUS_SQL";
    return fail(code, safetyError);
  }

  try {
    // DuckDB parser validation:
    const conn = await getDuckConnection();

    await ensureWorkspaceFresh(conn);

    await conn.query(`EXPLAIN ${sql}`);

    return {
      tool: "verify-sql",
      ok: true,
      data: null,
      action: "continue",
    };
  } catch (err) {
    const raw = String(err);
    console.error("SQL validation failed:", err);

    if (raw.includes("Parser Error")) {
      return {
        tool: "verify-sql",
        ok: false,
        action: "retry",
        error: {
          code: "SQL_SYNTAX_ERROR",
          message:
            "SQL syntax error — the AI generated an invalid query. Try rephrasing.",
        },
      };
    }

    if (raw.includes("Table") && raw.includes("not found")) {
      return {
        tool: "verify-sql",
        ok: false,
        action: "retry",
        error: {
          code: "TABLE_NOT_FOUND",
          message: "Query references a table that isn't loaded.",
        },
      };
    }

    if (raw.includes("Column") && raw.includes("not found")) {
      return {
        tool: "verify-sql",
        ok: false,
        action: "retry",
        error: {
          code: "COLUMN_NOT_FOUND",
          message: "Query references a column that doesn't exist.",
        },
      };
    }

    return {
      tool: "verify-sql",
      ok: false,
      action: "retry",
      error: {
        code: "SQL_VALIDATION_FAILED",
        message: "Query validation failed — please try again.",
      },
    };
  }
}
