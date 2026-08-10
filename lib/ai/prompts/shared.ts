import { Relationship } from "../context/relationships";
import { quoteIdentifier } from "../../utils/sqlHelpers";

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
