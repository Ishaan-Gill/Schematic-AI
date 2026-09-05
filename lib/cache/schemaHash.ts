import { sha256Hex } from "./sha256";

export async function schemaHash(schemas: Record<string, any[]>) {
  return sha256Hex(JSON.stringify(schemas));
}
