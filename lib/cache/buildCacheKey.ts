type BuildCacheKeyArgs = {
    normalizedQuery: string;
    schemaHash: string;
    // Time-relative queries get a day-granularity bucket so cached SQL
    // can never serve a stale window across a calendar boundary
    dateBucket?: string;
  };

  export function buildCacheKey({
    normalizedQuery,
    schemaHash,
    dateBucket,
  }: BuildCacheKeyArgs) {
    return `${normalizedQuery}:${schemaHash}${dateBucket ? `:${dateBucket}` : ""}`;
  }