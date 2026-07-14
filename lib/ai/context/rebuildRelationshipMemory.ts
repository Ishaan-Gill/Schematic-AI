import { datasetMemory } from "@/lib/upload/metadata/datasetMemory";
import { buildRelationshipsMemory } from "./relationshipsMap";

export function rebuildRelationshipMemory() {
  // Build schema map
  const allSchemas = Object.fromEntries(
    Object.entries(datasetMemory).map(([tableName, dataset]) => [
      tableName,
      dataset.schema,
    ]),
  );

  // Infer relationships
  const relationships = buildRelationshipsMemory(allSchemas);

  // Clear existing relationships
  for (const table of Object.keys(datasetMemory)) {
    datasetMemory[table].relationships = [];
  }

  // Inject fresh relationships
  for (const rel of relationships) {
    const fromEntry = datasetMemory[rel.fromTable];
    if (!fromEntry) continue;
    fromEntry.relationships = fromEntry.relationships ?? [];
    fromEntry.relationships.push(rel);
  }
  return relationships;
}
