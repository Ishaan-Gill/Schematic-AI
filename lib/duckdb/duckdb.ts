import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;

export async function getDuckDB() {
  if (db) return db;

  const bundles: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: "/duckdb/duckdb-mvp.wasm",
      mainWorker: "/duckdb/duckdb-browser-mvp.worker.js",
    },
    eh: {
      mainModule: "/duckdb/duckdb-eh.wasm",
      mainWorker: "/duckdb/duckdb-browser-eh.worker.js",
    },
  };
  const bundle = await duckdb.selectBundle(bundles);

  const worker = new Worker(bundle.mainWorker!, {
    type: "module",
  });
  const logger = new duckdb.ConsoleLogger();

  db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  console.log("DuckDB instance:", db);
  console.log(
    "Prototype methods:",
    Object.getOwnPropertyNames(Object.getPrototypeOf(db)),
  );

  return db;
}
