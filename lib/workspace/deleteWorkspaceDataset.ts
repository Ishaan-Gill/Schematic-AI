import type { StoredDataset } from "@/types/datasets";
import { datasetMemory } from "../upload/metadata/datasetMemory";
import { rebuildRelationshipMemory } from "../ai/context/rebuildRelationshipMemory";
import { getDuckConnection } from "../duckdb/duckdb";
import { dropTableOrView } from "../duckdb/dropObject";

type DeleteWorkspaceDatasetArgs = {
  dataset: StoredDataset;
};

export async function deleteWorkspaceDataset({
  dataset,
}: DeleteWorkspaceDatasetArgs) {
  const conn = await getDuckConnection();
  await dropTableOrView(conn, dataset.table_name);

  delete datasetMemory[dataset.table_name];

  rebuildRelationshipMemory();
}
