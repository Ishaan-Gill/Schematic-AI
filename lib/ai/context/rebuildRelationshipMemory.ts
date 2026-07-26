import { datasetMemory } from "@/lib/upload/metadata/datasetMemory";
import { detectRelationships } from "./relationships";
import type { Relationship, TableSchemas } from "./relationships";

export function rebuildRelationshipMemory() {
  const allSchemas: TableSchemas = Object.fromEntries(
    Object.entries(datasetMemory).map(([tableName, dataset]) => [
      tableName,
      dataset.schema,
    ]),
  );

  const relationships = detectRelationships(allSchemas);

  for (const table of Object.keys(datasetMemory)) {
    datasetMemory[table].relationships = [];
  }

  for (const rel of relationships) {
    const fromEntry = datasetMemory[rel.fromTable];
    if (!fromEntry) continue;
    fromEntry.relationships = fromEntry.relationships ?? [];
    fromEntry.relationships.push(rel);
  }
  return relationships;
}

export function getRelationships(): Relationship[] {
  const seen = new Set<string>();
  const result: Relationship[] = [];
  for (const entry of Object.values(datasetMemory)) {
    for (const rel of entry.relationships ?? []) {
      const key = `${(rel as Relationship).fromTable}.${(rel as Relationship).fromColumn}->${(rel as Relationship).toTable}.${(rel as Relationship).toColumn}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(rel as Relationship);
      }
    }
  }
  return result;
}
