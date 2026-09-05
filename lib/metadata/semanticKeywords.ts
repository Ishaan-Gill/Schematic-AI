export const REVENUE_KEYWORDS = [
    "revenue",
    "sales",
    "amount",
    "total",
    "price",
    "income",
    "profit",
    "margin",
    "discount",
    "tax",
    "fee",
    "balance",
    "payment",
    "budget",
    "cost",
    "invoice"
]

export const QUANTITY_KEYWORDS = [
    "qty",
    "quantity",
    "units",
    "count",
    "volume",
    "stock",
    "inventory",
    "num_of",
    "no_of"
]

export const CUSTOMER_KEYWORDS = [
    "customer",
    "client",
    "buyer",
    "user",
    "employee",
    "vendor"
]

export const DATE_KEYWORDS = [
    "date",
    "created",
    "timestamp",
    "year",
    "month",
    "quarter",
    "week",
    "day",
    "fiscal",
    "period"
]

export const PRODUCT_KEYWORDS = [
    "product",
    "item",
    "sku",
    // NOTE: "stock" intentionally lives only in QUANTITY_KEYWORDS and
    // "description" is treated as a name/label — inferSemanticRole resolves
    // both before product, so listing them here would classify the same
    // column two different ways depending on which module asks.
]

export const CATEGORY_KEYWORDS = [
    "category",
    "type",
    "segment",
    "class",
    "group",
    "tier",
    "status"
]

export const LOCATION_KEYWORDS = [
    "country",
    "city",
    "state",
    "region",
    "zone",
    "territory",
    "location",
    "address"
]

// Substrings that mark a ratio/percentage rather than an absolute amount
// (e.g. profit_margin). Shared so role inference and table-level context
// agree that these win over REVENUE_KEYWORDS like "margin".
export const PERCENTAGE_MARKERS = [
    "%",
    "percent",
    "pct",
    "growth",
    "rate",
    "ratio",
    "margin"
]

const includesAny = (lowerName: string, keywords: string[]) =>
    keywords.some((keyword) => lowerName.includes(keyword))

// Single source of truth for the name-based checks used by both
// inferSemanticRole and inferSemanticContext. Expects an already
// lowercased column name.
export const isIdentifierLike = (lowerName: string): boolean =>
    lowerName === "id" ||
    lowerName.endsWith("_id") ||
    lowerName.startsWith("id_") ||
    lowerName.endsWith("_key") ||
    lowerName.endsWith("_code") ||
    lowerName.endsWith("_ref") ||
    lowerName.endsWith("_no") ||
    lowerName.endsWith("_num") ||
    lowerName.endsWith("_sku")

export const isPercentageLike = (lowerName: string): boolean =>
    includesAny(lowerName, PERCENTAGE_MARKERS)

export const isLocationLike = (lowerName: string): boolean =>
    includesAny(lowerName, LOCATION_KEYWORDS)