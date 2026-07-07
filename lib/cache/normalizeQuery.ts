const FILLER_WORDS = [
  "show",
  "display",
  "give",
  "list",
  "fetch",
  "get",
  "please",
  "can",
  "could",
  "would",
  "me",
  "the",
  "all",
  "only",
  "just"
];

const synonyms: Record<string, string> = {
  display: "show",
  fetch: "show",
  list: "show",
  retrieve: "show",

  customer: "customer",
  customers: "customer",

  orders: "order",
  products: "product",
};

export function normalizeQuery(query: string) {
  return query
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(word => !FILLER_WORDS.includes(word))
    .map(word => synonyms[word] ?? word)
    .join(" ")
    .trim();
}