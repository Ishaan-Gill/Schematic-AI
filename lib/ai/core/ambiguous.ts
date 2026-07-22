type ambiguousArgs = {
    query: string;
    signal?: AbortSignal;
    guard?: () => boolean;
  };
  
  export const ambiguous = async ({
    query,
    signal,
    guard,
  }: ambiguousArgs) => {
    try {
      if (signal?.aborted || !(guard?.() ?? true)) return;
  
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          type: "ambiguous",
          payload: {query},
        }),
      });
      const data = await res.json();
      if (signal?.aborted || !(guard?.() ?? true)) return;
  
      if (!res.ok) {
        throw new Error(data.error ?? "Ambiguous failed");
      }
  
      return data.response as string;
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Ambiguous failed:", err);
    }
  };
  