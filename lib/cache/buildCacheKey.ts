type BuildCacheKeyArgs = {
    normalizedQuery: string;
    schemaHash: string;
    // Time-relative queries get a day-granularity bucket so cached SQL
    // can never serve a stale window across a calendar boundary
    dateBucket?: string;
    // Scopes the key to one user. query_cache rows carry no reliable
    // per-user predicate, so without this two users with identical schemas
    // and questions would share cached SQL.
    userId?: string;
  };

  export function buildCacheKey({
    normalizedQuery,
    schemaHash,
    dateBucket,
    userId,
  }: BuildCacheKeyArgs) {
    const scope = userId && userId.trim() ? userId.trim() : "anon";
    return `${scope}:${normalizedQuery}:${schemaHash}${dateBucket ? `:${dateBucket}` : ""}`;
  }