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
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(sql + schemaHashValue);
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
  const { error } = await supabase.from("explanation_cache").insert({
    cache_key: cacheKey,
    schema_hash: schemaHashValue,
    explanation,
  });

  if (error) {
    if (error.code === "23505") return;
    console.error("Failed to save explanation cache:", error);
    return;
  }

  if (DEBUG) console.log("EXPLANATION CACHE SAVED");
}
