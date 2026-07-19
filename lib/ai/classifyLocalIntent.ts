export function classifyLocalIntent(
  query: string,
): "CONVERSATIONAL" | null {
  const message = query.trim();
  if (!message) return null;

  const patterns: RegExp[] = [
    /^(hi|hello|hey)(\s+there)?[.!?\s]*$/i,
    /^good\s+(morning|afternoon|evening)[.!?\s]*$/i,
    /^(bye|goodbye|see\s+you|cya)[.!?\s]*$/i,
    /^thanks?(\s+you)?[.!?\s]*$/i,
    /^thx[.!?\s]*$/i,
    /^(ok|okay|cool|got\s+it|sure)[.!?\s]*$/i,
    /^how\s+are\s+you[.!?\s]*$/i,
    /^what('?s|s)\s+up[.!?\s]*$/i,
    /^(yo|sup)[.!?\s]*$/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(message)) return "CONVERSATIONAL";
  }

  return null;
}
