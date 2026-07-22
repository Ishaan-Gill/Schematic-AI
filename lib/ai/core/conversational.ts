type conversationalArgs = {
  query: string;
  signal?: AbortSignal;
  guard?: () => boolean;
};

export const conversational = async ({
  query,
  signal,
  guard,
}: conversationalArgs) => {
  try {
    if (signal?.aborted || !(guard?.() ?? true)) return;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        type: "conversation",
        payload: {query},
      }),
    });
    const data = await res.json();
    if (signal?.aborted || !(guard?.() ?? true)) return;

    if (!res.ok) {
      throw new Error(data.error ?? "Conversational failed");
    }

    return data.response as string;
  } catch (err) {
    if (signal?.aborted) return;
    console.error("Conversational failed:", err);
  }
};
