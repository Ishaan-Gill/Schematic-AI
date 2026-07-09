import * as duckdb from "@duckdb/duckdb-wasm"

export type DuckDatabase = duckdb.AsyncDuckDB;
export type DuckConnection = duckdb.AsyncDuckDBConnection;