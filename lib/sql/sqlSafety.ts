/**
 * Shared SQL safety policy — single source of truth.
 *
 * Pure module: no DuckDB, no server/client APIs. Safe to import from
 * client components, WASM tools, and API routes.
 *
 * Boundary: untrusted/generated SQL -> checkSQLSafetySync -> EXPLAIN -> execution.
 */

const BLOCK_KEYWORDS = [
  "drop",
  "delete",
  "update",
  "truncate",
  "insert",
  "alter",
  "create",
  "copy",
  "attach",
  "detach",
  "install",
  "load",
  "pragma",
  "vacuum",
  "checkpoint",
  "call",
  "execute",
  "use",
] as const;

/**
 * Remove fenced code wrappers before any safety check so
 * ```sql SELECT 1; ``` is judged by its SQL, not its markdown.
 */
export function stripCodeFences(sql: string): string {
  return sql
    .replace(/```sql/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Blank out string literals, quoted identifiers, and comments so keyword
 * checks don't flag legitimate content such as a column named
 * "update date" or a literal ';'.
 *
 * Each match is replaced with spaces to preserve word boundaries.
 */
export function stripLiteralsAndComments(sql: string): string {
  return sql
    // Block comments /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length))
    // Line comments -- ...
    .replace(/--[^\n]*/g, (m) => " ".repeat(m.length))
    // Single-quoted strings ('' escaped)
    .replace(/'(?:''|[^'])*'/g, (m) => " ".repeat(m.length))
    // Double-quoted identifiers ("" escaped)
    .replace(/"(?:""|[^"])*"/g, (m) => " ".repeat(m.length))
    // Backtick identifiers
    .replace(/`(?:``|[^`])*`/g, (m) => " ".repeat(m.length));
}

/**
 * Synchronous safety gate: keywords, statement type, multi-statement,
 * and DuckDB-specific exfiltration primitives. Returns a user-friendly
 * error string, or null when the SQL passes.
 */
export function checkSQLSafetySync(sql: unknown): string | null {
  if (!sql || typeof sql !== "string" || !sql.trim()) {
    return "Something went wrong. Please try again.";
  }

  const cleaned = stripCodeFences(sql).replace(/;+\s*$/, "").trim();
  if (!cleaned) {
    return "Something went wrong. Please try again.";
  }

  const stripped = stripLiteralsAndComments(cleaned);

  for (const keyword of BLOCK_KEYWORDS) {
    const pattern = new RegExp(`\\b${keyword}\\b`, "i");
    if (pattern.test(stripped)) {
      return `Dangerous SQL detected: ${keyword.toUpperCase()}`;
    }
  }

  const lowered = cleaned.toLowerCase();
  if (
    !lowered.startsWith("select") &&
    !lowered.startsWith("with") &&
    !lowered.startsWith("describe")
  ) {
    return "Only SELECT queries are allowed.";
  }

  // Multi-statement: any remaining semicolon in code (not strings) means
  // more than one statement. Trailing semicolons were already stripped.
  if (stripped.includes(";")) {
    return "Multiple SQL statements detected. Please ask one question at a time, or ask for a combined breakdown.";
  }

  const loweredStripped = stripped.toLowerCase();

  // External file / remote access table functions. Workspace queries
  // operate on already-loaded views, so generated SQL never needs these.
  if (/\bread_(parquet|csv|csv_auto|json|arrow|text)\s*\(/.test(loweredStripped)) {
    return "External file access is not allowed.";
  }
  if (/\bhttpfs\b/.test(loweredStripped)) {
    return "External file access is not allowed.";
  }
  if (/\b(read_text|read_blob|read_json_objects|parquet_scan|csv_scan)\s*\(/.test(loweredStripped)) {
    return "External file access is not allowed.";
  }

  // Extension loading / filesystem / catalog abuse. LOAD/INSTALL/ATTACH
  // are already in BLOCK_KEYWORDS; these cover function-call spellings
  // that survive literal stripping, e.g. SELECT load('httpfs').
  if (/\b(load|install)\s*\(/.test(loweredStripped)) {
    return "Dangerous SQL detected: extension loading is not allowed.";
  }
  if (/\b(current_setting|current_database|version)\s*\(/.test(loweredStripped)) {
    return "Dangerous SQL detected: system functions are not allowed.";
  }

  // System catalog escape via otherwise-valid SELECT.
  if (/\binformation_schema\b/.test(loweredStripped)) {
    return "Query references a table that isn't loaded.";
  }
  if (/\bpg_(catalog|catalogs|tables|class|attribute)\b/.test(loweredStripped)) {
    return "Query references a table that isn't loaded.";
  }
  if (/\bduckdb_(tables|columns|views|schemas)\s*\(/.test(loweredStripped)) {
    return "Query references a table that isn't loaded.";
  }

  return null;
}
