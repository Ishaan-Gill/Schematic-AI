import type { DuckConnection } from "@/types/duckdb";

import { fetchDatasets } from "./fetchDatasets";
import { rehydrateMemory } from "./rehydrateMemory";
import { mountParquetViews } from "../duckdb/mountParquetViews";

export async function rehydrateSession(
  conn: DuckConnection
) {
  const datasets = await fetchDatasets();

  await rehydrateMemory(datasets);

  await mountParquetViews(conn, datasets);

  return datasets;
}