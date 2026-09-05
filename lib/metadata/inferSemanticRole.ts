import {
    QUANTITY_KEYWORDS,
    CUSTOMER_KEYWORDS,
    DATE_KEYWORDS,
    PRODUCT_KEYWORDS,
    CATEGORY_KEYWORDS,
    REVENUE_KEYWORDS,
    isIdentifierLike,
    isLocationLike,
    isPercentageLike,
} from "./semanticKeywords"

import { SemanticRole } from "./types";

const includesAny = (value: string, keywords: string[]) =>
    keywords.some((keyword) => value.includes(keyword))

export const inferSemanticRole = (
    column: string,
    type: string
): SemanticRole => {
    const name = column.toLowerCase()
    const normalizedType = String(type).toLowerCase()

    // Identifier — strict boundary check (shared helper)
    if (isIdentifierLike(name)) return "id"

    // Temporal
    if (includesAny(name, DATE_KEYWORDS)) return normalizedType === "varchar" ? "datetime" : "date"

    // Percentage (wins over revenue: profit_margin is a ratio, not an amount)
    if (isPercentageLike(name)) return "percentage"

    // Currency / Financial metric
    if (includesAny(name, REVENUE_KEYWORDS)) return "currency"

    // Geographic (before quantity: "country" contains the quantity
    // substring "count" and must resolve to location)
    if (isLocationLike(name)) return "location"

    // Quantity / Operational
    if (includesAny(name, QUANTITY_KEYWORDS)) return "quantity"

    // Entity / Person
    if (includesAny(name, CUSTOMER_KEYWORDS)) return "name"

    // Category
    if (includesAny(name, CATEGORY_KEYWORDS)) return "category"

    // Name / Label
    if (name.includes("name") || name.includes("title") ||
        name.includes("label") || name.includes("description")
    ) return "name"

    // Product / SKU / Item
    if (includesAny(name, PRODUCT_KEYWORDS)) return "product"

    // Fallback by type
    if (
        normalizedType.includes("varchar") ||
        normalizedType.includes("text") ||
        normalizedType.includes("char")
    ) return "text"
    
    return "unknown"
}