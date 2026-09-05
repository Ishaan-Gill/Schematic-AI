// Canonical request-liveness check.
//
// Pure function (no browser or Node APIs), so it is safe to share across
// the client orchestrators (lib/ai/core, lib/ai/tools) and the server Groq
// executors (lib/ai/chat). Semantics: a request is active when its signal
// has not aborted AND its guard (usually "this controller is still the
// latest") still passes.
export const isActive = (guard?: () => boolean, signal?: AbortSignal) =>
  !signal?.aborted && (guard?.() ?? true);
