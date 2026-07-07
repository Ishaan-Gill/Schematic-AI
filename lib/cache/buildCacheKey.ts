type BuildCacheKeyArgs = {
    normalizedQuery: string;
    schemaHash: string;
  };
  
  export function buildCacheKey({
    normalizedQuery,
    schemaHash,
  }: BuildCacheKeyArgs) {
    return `${normalizedQuery}:${schemaHash}`;
  }