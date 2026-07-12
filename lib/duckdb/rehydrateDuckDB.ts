import { getDuckDB } from "./duckdb";
import { fetchDatasets } from "@/lib/rehydration/fetchDatasets";
import { rehydrateMemory } from "@/lib/rehydration/rehydrateMemory";
import { mountParquetViews } from "./mountParquetViews";
import { setWorkspaceExpiry } from "./workspaceExpiry";

export async function rehydrateDuckDB() {
    console.log("Rehydrating DuckDB...");

    const db = await getDuckDB();
    const conn = await db.connect();

    const datasets = await fetchDatasets();

    console.log(`Fetched ${datasets.length} datasets`);

    await rehydrateMemory(datasets);

    console.log("Memory restored");

    await mountParquetViews(conn, datasets);

    setWorkspaceExpiry(Date.now() + 6 * 60 * 60 * 1000);

    console.log("DuckDB views mounted");

    return {
        db,
        conn,
        datasets,
    };
}