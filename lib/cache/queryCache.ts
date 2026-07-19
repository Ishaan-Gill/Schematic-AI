import { createClient } from "@/lib/supabase/client";
import { DEBUG } from "@/lib/config/debug";

type SaveCachedSQLArgs = {
  cacheKey: string;
  normalizedQuery: string;
  schemaHash: string;
  sql: string;
};

/**
 * Looks for a cached SQL query.
 *
 * Returns:
 *  - SQL string -> Cache HIT
 *  - null       -> Cache MISS
 */
const supabase = createClient();

export async function getCachedSQL(cacheKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("query_cache")
    .select("sql")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString()) // ignore expired cache
    .maybeSingle();

  if (error) {
    console.error("Cache lookup failed:", error);
    return null;
  }

  if (!data) {
    if (DEBUG) {
      console.log("CACHE MISS");
    }
    return null;
  }

  if (DEBUG) {
    console.log("CACHE HIT");
  }

  return data.sql;
}

/**
 * Saves newly generated SQL into cache.
 *
 * Duplicate inserts are ignored because another request
 * may have already cached the exact same query.
 */
export async function saveCachedSQL({
  cacheKey,
  normalizedQuery,
  schemaHash,
  sql,
}: SaveCachedSQLArgs): Promise<void> {
  const { error } = await supabase.from("query_cache").insert({
    cache_key: cacheKey,
    normalized_query: normalizedQuery,
    schema_hash: schemaHash,
    sql,
  });

  if (error) {
    // Duplicate cache entry -> ignore
    if (error.code === "23505") {
      return;
    }

    console.error("Failed to save cache:", error);
    return;
  }

  if (DEBUG) {
    console.log("CACHE SAVED");
  }
}


// TODO:
// After authentication:
// - add user_id to cache key
// - replace public RLS with auth.uid() policies
// - move cache operations to server-side API using Service Role