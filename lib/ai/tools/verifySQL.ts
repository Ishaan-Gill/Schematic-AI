import { getDuckConnection } from "@/lib/duckdb/duckdb";
import type { TurnRuntime, ToolResult } from "../orchestrator/types";
import { ensureWorkspaceFresh } from "@/lib/duckdb/ensureWorkspaceFresh";

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

  // Block dangerous keywords:
  const blockKeywords = [
    "drop",
    "delete",
    "update",
    "truncate",
    "insert",
    "alter",
    "create",
  ];

  for (const keyword of blockKeywords) {
    const pattern = new RegExp(`\\b${keyword}\\b`, "i");

    if (pattern.test(sql)) {
      return {
        tool: "verify-sql",
        ok: false,
        action: "retry",
        error: {
          code: "DANGEROUS_SQL",
          message: `Dangerous SQL detected: ${keyword.toUpperCase()}`,
        },
      };
    }
  }

  // Only allow SELECT | WITH | DESCRIBE:
  const trimmed = sql.trim().toLowerCase();
  if (
    !trimmed.startsWith("select") &&
    !trimmed.startsWith("with") &&
    !trimmed.startsWith("describe")
  ) {
    return {
      tool: "verify-sql",
      ok: false,
      action: "retry",
      error: {
        code: "INVALID_SQL_TYPE",
        message: "Only SELECT queries are allowed.",
      },
    };
  }

  // Detect multiple statements — a semicolon followed by
  // more non-whitespace content means multiple statements
  const trimmedStatement = trimmed.replace(/;\s*$/, ""); // strip trailing semicolon only
  if (trimmedStatement.includes(";")) {
    return {
      tool: "verify-sql",
      ok: false,
      action: "retry",
      error: {
        code: "MULTIPLE_STATEMENTS",
        message:
          "Multiple SQL statements detected. Please ask one question at a time, or ask for a combined breakdown.",
      },
    };
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
