// Canonical BigInt handling for JSON serialization.
//
// DuckDB returns BIGINT columns as JS bigints, which JSON.stringify rejects.
// Every serialization site must convert bigints to their exact decimal string
// form — never to Number (values can exceed Number.MAX_SAFE_INTEGER).

export const bigIntReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? value.toString() : value;

export const toJsonSafe = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, bigIntReplacer));
