export async function schemaHash(schemas: Record<string, any[]>) {
  const encoder = new TextEncoder();

  const json = JSON.stringify(schemas);

  const data = encoder.encode(json);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
