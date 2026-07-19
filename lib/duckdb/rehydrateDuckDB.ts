import { DEBUG } from "@/lib/config/debug";
import { getDuckConnection } from "./duckdb";
import { fetchDatasets } from "@/lib/rehydration/fetchDatasets";
import { rehydrateMemory } from "@/lib/rehydration/rehydrateMemory";
import { mountParquetViews } from "./mountParquetViews";
import { setWorkspaceExpiry } from "./workspaceExpiry";

export async function rehydrateDuckDB() {
    if (DEBUG) console.log("Rehydrating DuckDB...");

    const conn = await getDuckConnection();

    const datasets = await fetchDatasets();

    if (DEBUG) console.log(`Fetched ${datasets.length} datasets`);

    await rehydrateMemory(datasets);

    if (DEBUG) console.log("Memory restored");

    await mountParquetViews(conn, datasets);

    setWorkspaceExpiry(Date.now() + 6 * 60 * 60 * 1000);

    if (DEBUG) console.log("DuckDB views mounted");

    return {
        datasets,
    };
}