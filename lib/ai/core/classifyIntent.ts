type ClassifyIntentArgs = {
  query: string;
  schemas: Record<string, any[]>;
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const classifyIntent = async ({
  query,
  schemas,
  signal,
  guard,
}: ClassifyIntentArgs) => {
  try {
    if (signal?.aborted || !(guard?.() ?? true)) return;

    const res = await fetch("/api/classify-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        query,
        schemas,
      }),
    });
    const data = await res.json();
    if (signal?.aborted || !(guard?.() ?? true)) return;

    if (!res.ok) {
      throw new Error(data.error ?? "Intent classification failed");
    }

    return data.intent as
      | "CONVERSATIONAL"
      | "REASONING"
      | "DATA_QUERY"
      | "AMBIGUOUS";
  } catch (err) {
    if (signal?.aborted) return;
    console.error("Classifiy intent failed:", err);
  }
};
