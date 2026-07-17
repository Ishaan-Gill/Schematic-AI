import type { StoredDataset } from "@/types/datasets";
import { quoteIdentifier } from "../utils/sqlHelpers";
import { datasetMemory } from "../upload/metadata/datasetMemory";
import { rebuildRelationshipMemory } from "../ai/context/rebuildRelationshipMemory";
import { getDuckConnection } from "../duckdb/duckdb";

type DeleteWorkspaceDatasetArgs = {
  dataset: StoredDataset;
};

export async function deleteWorkspaceDataset({
  dataset,
}: DeleteWorkspaceDatasetArgs) {
  const conn = await getDuckConnection();
  await conn.query(`
    DROP VIEW IF EXISTS ${quoteIdentifier(dataset.table_name)}
  `);

  delete datasetMemory[dataset.table_name];

  rebuildRelationshipMemory();
}
