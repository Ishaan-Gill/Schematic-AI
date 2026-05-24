import {
    QUANTITY_KEYWORDS,
    CUSTOMER_KEYWORDS,
    DATE_KEYWORDS,
    PRODUCT_KEYWORDS,
    CATEGORY_KEYWORDS,
    REVENUE_KEYWORDS
} from "./semanticKeywords"

import { SemanticRole } from "./types";

const includesAny = (value: string, keywords: string[]) =>
    keywords.some((keyword) => value.includes(keyword))

export const inferSemanticRole = (
    column: string,
    type: string
): SemanticRole => {
    const name = column.toLowerCase()

    // Identifier — strict boundary check
    if (
        name === "id" ||
        name.endsWith("_id") ||
        name.startsWith("id_") ||
        name.endsWith("_key") ||
        name.endsWith("_code") ||
        name.endsWith("_ref") ||
        name.endsWith("_no") ||
        name.endsWith("_num") ||
        name.endsWith("_sku")
    ) return "id"

    // Temporal
    if (includesAny(name, DATE_KEYWORDS)) return type === "VARCHAR" ? "datetime" : "date"

    // Currency / Financial metric
    if (includesAny(name, REVENUE_KEYWORDS) ) return "currency"

    // Percentage
    if (
        name.includes("%") || name.includes("percent") ||
        name.includes("growth") || name.includes("rate") ||
        name.includes("ratio")
    ) return "percentage"

    // Quantity / Operational
    if (includesAny(name, QUANTITY_KEYWORDS) ) return "quantity"

    // Geographic
    if (
        name.includes("country") || name.includes("city") ||
        name.includes("state") || name.includes("region") ||
        name.includes("zone") || name.includes("territory") ||
        name.includes("location") || name.includes("address")
    ) return "country"

    // Entity / Person
    if (includesAny(name, CUSTOMER_KEYWORDS) ) return "name"

    // Category
    if (includesAny(name, CATEGORY_KEYWORDS) ) return "category"

    // Name / Label
    if (name.includes("name") || name.includes("title") ||
        name.includes("label") || name.includes("description")
    ) return "name"

    // Fallback by type
    if (type === "VARCHAR") return "text"

    return "unknown"
}