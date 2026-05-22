import { SemanticRole } from "./types";

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
    if (
        name.includes("date") || name.includes("time") ||
        name.includes("year") || name.includes("month") ||
        name.includes("quarter") || name.includes("week") ||
        name.includes("period") || name.includes("fiscal") ||
        name.includes("day")
    ) return type === "VARCHAR" ? "datetime" : "date"

    // Currency / Financial metric
    if (
        name.includes("price") || name.includes("amount") ||
        name.includes("revenue") || name.includes("sales") ||
        name.includes("cost") || name.includes("profit") ||
        name.includes("margin") || name.includes("discount") ||
        name.includes("tax") || name.includes("fee") ||
        name.includes("balance") || name.includes("total") ||
        name.includes("subtotal") || name.includes("payment") ||
        name.includes("budget") || name.includes("actual") ||
        name.includes("invoice")
    ) return "currency"

    // Percentage
    if (
        name.includes("%") || name.includes("percent") ||
        name.includes("growth") || name.includes("rate") ||
        name.includes("ratio")
    ) return "percentage"

    // Quantity / Operational
    if (
        name.includes("qty") || name.includes("quantity") ||
        name.includes("units") || name.includes("count") ||
        name.includes("volume") || name.includes("stock") ||
        name.includes("inventory") || name.includes("num_of") ||
        name.includes("no_of")
    ) return "quantity"

    // Geographic
    if (
        name.includes("country") || name.includes("city") ||
        name.includes("state") || name.includes("region") ||
        name.includes("zone") || name.includes("territory") ||
        name.includes("location") || name.includes("address")
    ) return "country"

    // Entity / Person
    if (
        name.includes("customer") || name.includes("client") ||
        name.includes("vendor") || name.includes("supplier") ||
        name.includes("employee") || name.includes("user")
    ) return "name"

    // Category
    if (
        name.includes("category") || name.includes("type") ||
        name.includes("segment") || name.includes("class") ||
        name.includes("group") || name.includes("tier")
    ) return "category"

    // Name / Label
    if (name.includes("name") || name.includes("title") ||
        name.includes("label") || name.includes("description")
    ) return "name"

    // Fallback by type
    if (type === "VARCHAR") return "text"

    return "unknown"
}