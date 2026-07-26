import { fetchDatasets } from "@/lib/rehydration/fetchDatasets";
import { mountParquetViews } from "./mountParquetViews";
import { getWorkspaceExpiry, setWorkspaceExpiry } from "./workspaceExpiry";
import { DEBUG } from "@/lib/config/debug";
import type { DuckConnection } from "@/types/duckdb";

export async function ensureWorkspaceFresh(conn: DuckConnection) {
  if (Date.now() >= getWorkspaceExpiry()) {
    const datasets = await fetchDatasets();
    await mountParquetViews(conn, datasets);
    setWorkspaceExpiry(Date.now() + 6 * 60 * 60 * 1000);
    if (DEBUG) console.log("🔄 Signed URLs refreshed");
  }
}
