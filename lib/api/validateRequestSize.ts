const MAX_PAYLOAD_BYTES = 100 * 1024;

export function isPayloadTooLarge(body: unknown): boolean {
  const json = JSON.stringify(body);
  return new TextEncoder().encode(json).length > MAX_PAYLOAD_BYTES;
}
