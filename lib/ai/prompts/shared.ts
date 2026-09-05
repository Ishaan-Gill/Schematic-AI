import { Relationship } from "../context/relationships";
import { quoteIdentifier } from "../../utils/sqlHelpers";
import {
  MAX_CONTEXT_COLUMNS,
  MAX_CONTEXT_TABLES,
} from "../context/contextLimits";

export function formatSchemaText(schemas: Record<string, any[]>) {
  return Object.entries(schemas)
    .map(([tableName, cols]) => {
      const colText = (cols as any[])
        .map((col: any) => quoteIdentifier(col.column_name))
        .join(", ");
      return `${tableName} (${colText})`;
    })
    .join("\n");
}

export function formatRelationshipText(relationships: Relationship[]) {
  if (relationships.length === 0) {
    return "No relationships detected.";
  }
  return relationships
    .map(
      (r: any) => `${r.fromTable}.${r.fromColumn} = ${r.toTable}.${r.toColumn}`,
    )
    .join("\n");
}

type SchemaColumnLike = {
  column_name?: string;
  column_type?: string;
};

type DatasetHintItem = {
  column?: string;
  semanticRole?: string;
  detectedFormat?: string;
  coercionNote?: string;
};

type DatasetMetricItem = {
  name?: string;
  expression?: string;
};

// Typed `table: "col" (TYPE)` schema rendering shared by the SQL-generation
// and analysis prompts (same tables/columns limits, delimiters, quoting).
export function formatTypedSchemaText(
  schemas: Record<string, unknown[]>,
): string {
  return Object.entries(schemas)
    .slice(0, MAX_CONTEXT_TABLES)
    .map(([tableName, cols]) => {
      const colText = (cols as SchemaColumnLike[])
        .slice(0, MAX_CONTEXT_COLUMNS)
        .map(
          (col) =>
            `${quoteIdentifier(col.column_name ?? "")} (${col.column_type ?? "unknown"})`,
        )
        .join(", ");
      return `${tableName}: ${colText}`;
    })
    .join("\n\n");
}

// Per-table semantic-hint rendering shared by the SQL-generation,
// reasoning, and analysis prompts (same ordering, slices, delimiters).
export function formatDatasetHints(
  datasetContext: Record<string, unknown>,
): string {
  return Object.entries(datasetContext)
    .map(([tableName, rawCtx]) => {
      const ctx = (rawCtx ?? {}) as { metadata?: DatasetHintItem[] };
      const hints = (ctx.metadata ?? [])
        .slice(0, MAX_CONTEXT_COLUMNS)
        .map(
          (item) =>
            `  - ${item.column ?? ""} → ${item.semanticRole ?? "unknown"}${item.detectedFormat ? ` (${item.detectedFormat})` : ""}${item.coercionNote ? ` — ${item.coercionNote}` : ""}`,
        )
        .join("\n");
      return `${tableName}:\n${hints}`;
    })
    .join("\n\n");
}

// Per-table derived-metric rendering shared by the same prompts.
export function formatMetricLine(
  tableName: string,
  metric: { name?: string; expression?: string },
): string {
  return `- [${tableName}] ${metric.name ?? ""} = ${metric.expression ?? ""}`;
}

export function formatDatasetMetrics(
  datasetContext: Record<string, unknown>,
): string {
  return Object.entries(datasetContext)
    .map(([tableName, rawCtx]) => {
      const ctx = (rawCtx ?? {}) as { metrics?: DatasetMetricItem[] };
      return (ctx.metrics ?? [])
        .slice(0, 20)
        .map((metric) => formatMetricLine(tableName, metric))
        .join("\n");
    })
    .join("\n");
}
