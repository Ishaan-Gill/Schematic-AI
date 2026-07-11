"use client";

import { getDuckDB } from "@/lib/duckdb/duckdb";
import { fetchDatasets } from "@/lib/rehydration/fetchDatasets";
import { mountParquetViews } from "@/lib/duckdb/mountParquetViews";

export default function TestPage() {
  async function run() {
    const db = await getDuckDB();

    // First connection
    const conn1 = await db.connect();

    const datasets = await fetchDatasets();

    await mountParquetViews(conn1, datasets);

    console.log("Views mounted.");

    await conn1.close();

    console.log("Connection 1 closed.");

    // Second connection
    const conn2 = await db.connect();

    console.log("Connection 2 opened.");

    try {
      const result = await conn2.query(`
        SELECT *
        FROM customer_contact_exp
        LIMIT 5
      `);

      console.log("✅ VIEW STILL EXISTS");
      console.log(result.toArray());
    } catch (err) {
      console.error("❌ VIEW DISAPPEARED");
      console.error(err);
    }

    await conn2.close();
  }

  return (
    <main className="p-10">
      <button
        className="border p-4 rounded"
        onClick={run}
      >
        Test View Persistence
      </button>
    </main>
  );
}