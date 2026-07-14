import { rebuildRelationshipMemory } from "../ai/context/rebuildRelationshipMemory";
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
  rebuildRelationshipMemory();
}
