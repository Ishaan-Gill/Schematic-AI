import { createClient } from "@/lib/supabase/client";
import { DEBUG } from "@/lib/config/debug";

type SaveCachedExplanationArgs = {
  cacheKey: string;
  schemaHash: string;
  explanation: string;
};

const supabase = createClient();

export async function buildExplanationCacheKey(
  sql: string,
  schemaHashValue: string,
  context = "",
  // Scopes the key to one user so explanations (which embed row values)
  // are never served across accounts sharing identical schemas.
  userId?: string,
): Promise<string> {
  const scope = userId && userId.trim() ? userId.trim() : "anon";
  const encoder = new TextEncoder();
  const data = encoder.encode(scope + sql + schemaHashValue + context);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getCachedExplanation(
  cacheKey: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("explanation_cache")
    .select("explanation")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Explanation cache lookup failed:", error);
    return null;
  }

  if (!data) {
    if (DEBUG) console.log("EXPLANATION CACHE MISS");
    return null;
  }

  if (DEBUG) console.log("EXPLANATION CACHE HIT");
  return data.explanation;
}

export async function saveCachedExplanation({
  cacheKey,
  schemaHash: schemaHashValue,
  explanation,
}: SaveCachedExplanationArgs): Promise<void> {
  const { error } = await supabase.from("explanation_cache").upsert(
    {
      cache_key: cacheKey,
      schema_hash: schemaHashValue,
      explanation,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      onConflict: "cache_key",
    },
  );

  if (error) {
    console.error("Failed to save explanation cache:", error);
    return;
  }

  if (DEBUG) console.log("EXPLANATION CACHE SAVED");
}
