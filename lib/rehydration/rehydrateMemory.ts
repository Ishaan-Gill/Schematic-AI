import { buildRelationshipsMemory } from "../ai/context/relationshipsMap";
import { datasetMemory } from "../upload/metadata/datasetMemory";

export async function rehydrateMemory(datasets: any[]) {
  // clear old memory
  for (const key of Object.keys(datasetMemory)) {
    delete datasetMemory[key];
  }

  // rebuild memory
  for (const dataset of datasets) {
    datasetMemory[dataset.table_name] = {
      schema: dataset.schema,
      profile: dataset.profile,
      semantic: dataset.semantic,
      relationships: [],
      feedback: {
        successfulQueries: [],
        failedQueries: [],
      },
    };
  }

  // rebuild relationships
  const allSchemas = Object.fromEntries(
    Object.entries(datasetMemory).map(([table, data]) => [table, data.schema]),
  );

  const relationships = buildRelationshipsMemory(allSchemas);

  for (const table of Object.keys(datasetMemory)) {
    datasetMemory[table].relationships = [];
  }

  for (const rel of relationships) {
    const fromEntry = datasetMemory[rel.fromTable];

    if (!fromEntry) continue;

    fromEntry.relationships = fromEntry.relationships ?? [];
    fromEntry.relationships.push(rel);
  }
}
