import { stripCodeFences } from "./sqlSafety";

type SchemaColumnLike = {
  column_name: string;
};

type SchemasInput = Record<string, Array<SchemaColumnLike>>;

/**
 * Allowlist check: every table referenced via FROM/JOIN must exist in the
 * workspace schema, and qualified `table.column` references must name a
 * real column of a known table.
 *
 * Deliberately conservative: unqualified columns, aliases that cannot be
 * resolved, CTE names, and expression internals are skipped rather than
 * rejected, to avoid false positives on valid analytical SQL
 * (subqueries, aggregates, aliases, quoted identifiers).
 *
 * Returns a user-friendly error string, or null when the SQL passes.
 */
export function validateAgainstSchema(
  sql: unknown,
  schemas: unknown,
): string | null {
  if (!sql || typeof sql !== "string" || !sql.trim()) {
    return "Something went wrong. Please try again.";
  }
  if (!schemas || typeof schemas !== "object") {
    return null;
  }

  const schemaEntries = Object.entries(schemas as SchemasInput).filter(
    (entry): entry is [string, Array<SchemaColumnLike>] =>
      Array.isArray(entry[1]),
  );
  if (schemaEntries.length === 0) {
    return null;
  }

  const tableLookup = new Map<string, string>();
  const columnLookup = new Map<string, Set<string>>();
  for (const [tableName, cols] of schemaEntries) {
    const lowerTable = tableName.toLowerCase();
    tableLookup.set(lowerTable, tableName);
    const colSet = new Set<string>();
    for (const col of cols) {
      if (col && typeof col.column_name === "string") {
        colSet.add(col.column_name.toLowerCase());
      }
    }
    columnLookup.set(lowerTable, colSet);
  }

  // Remove strings/comments for structural parsing, but keep
  // double-quoted identifiers (needed for "My Table" names).
  const withoutStrings = stripCodeFences(sql)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/'(?:''|[^'])*'/g, " ");

  // Collect CTE names so WITH cte AS (...) SELECT * FROM cte passes.
  const cteNames = new Set<string>();
  const ctePattern =
    /\bwith\b\s+("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s+as\s*\(/gi;
  let cteMatch: RegExpExecArray | null;
  while ((cteMatch = ctePattern.exec(withoutStrings)) !== null) {
    const name = (cteMatch[2] ?? cteMatch[3] ?? "").toLowerCase();
    if (name) cteNames.add(name);
  }
  // Additional CTEs separated by commas: `, name AS (`
  const chainedCtePattern =
    /,\s*("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s+as\s*\(/gi;
  while ((cteMatch = chainedCtePattern.exec(withoutStrings)) !== null) {
    const name = (cteMatch[2] ?? cteMatch[3] ?? "").toLowerCase();
    if (name) cteNames.add(name);
  }

  const IGNORED_TABLES = new Set(["paginated_query"]);

  // FROM / JOIN <table> (optionally db.schema.table, quoted or bare).
  const tableRefPattern =
    /\b(?:from|join)\s+("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))(?:\s*\.\s*("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*)))*/gi;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRefPattern.exec(withoutStrings)) !== null) {
    const fullRef = tableMatch[0]
      .replace(/^\s*(?:from|join)\s+/i, "")
      .trim();
    const parts: string[] = [];
    const partPattern = /"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*)/g;
    let part: RegExpExecArray | null;
    while ((part = partPattern.exec(fullRef)) !== null) {
      parts.push((part[1] ?? part[2] ?? "").toLowerCase());
    }
    if (parts.length === 0) continue;
    const tableName = parts[parts.length - 1];
    if (!tableName) continue;
    if (cteNames.has(tableName)) continue;
    if (IGNORED_TABLES.has(tableName)) continue;
    if (!tableLookup.has(tableName)) {
      return "Query references a table that isn't loaded.";
    }
  }

  // Build alias -> table map from FROM/JOIN clauses (single-level only).
  const aliasToTable = new Map<string, string>();
  const aliasPattern =
    /\b(?:from|join)\s+("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))(?:\s*\.\s*("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*)))*\s*(?:as\s+)?("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))?/gi;
  let aliasMatch: RegExpExecArray | null;
  const RESERVED_FOLLOWERS = new Set([
    "where",
    "group",
    "order",
    "limit",
    "offset",
    "join",
    "inner",
    "left",
    "right",
    "full",
    "cross",
    "on",
    "using",
    "select",
    "having",
    "union",
    "except",
    "intersect",
    "window",
    "for",
    "into",
  ]);
  while ((aliasMatch = aliasPattern.exec(withoutStrings)) !== null) {
    const refPart = aliasMatch[0].replace(/^\s*(?:from|join)\s+/i, "").trim();
    // Re-parse table + optional alias from the clause fragment.
    const tokens: string[] = [];
    const tokPattern = /"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*)/g;
    let tok: RegExpExecArray | null;
    while ((tok = tokPattern.exec(refPart)) !== null) {
      tokens.push(tok[1] ?? tok[2] ?? "");
    }
    if (tokens.length >= 2) {
      const maybeAlias = tokens[tokens.length - 1].toLowerCase();
      const tableCandidate = tokens[tokens.length - 2].toLowerCase();
      if (
        tableLookup.has(tableCandidate) &&
        !RESERVED_FOLLOWERS.has(maybeAlias) &&
        maybeAlias !== tableCandidate
      ) {
        aliasToTable.set(maybeAlias, tableCandidate);
      }
      // `AS alias` form: last two tokens are table + alias already handled;
      // three-token `db.table alias` handled by same rule.
    }
  }

  // Qualified column refs: <table-or-alias>.<column>
  const qualifiedPattern =
    /("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*\.\s*("([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/g;
  let qualMatch: RegExpExecArray | null;
  while ((qualMatch = qualifiedPattern.exec(withoutStrings)) !== null) {
    const leftRaw = (qualMatch[2] ?? qualMatch[3] ?? "").toLowerCase();
    const rightRaw = (qualMatch[5] ?? qualMatch[6] ?? "").toLowerCase();
    if (!leftRaw || !rightRaw) continue;
    // Numeric-ish `table.123` fragments are not column refs.
    if (/^[0-9]/.test(rightRaw)) continue;

    let resolvedTable: string | undefined;
    if (tableLookup.has(leftRaw)) {
      resolvedTable = leftRaw;
    } else if (aliasToTable.has(leftRaw)) {
      resolvedTable = aliasToTable.get(leftRaw);
    } else {
      // Unresolvable qualifier (CTE, subquery alias, expression) — skip.
      continue;
    }
    const cols = columnLookup.get(resolvedTable as string);
    if (cols && !cols.has(rightRaw)) {
      return "Query references a column that doesn't exist.";
    }
  }

  return null;
}
