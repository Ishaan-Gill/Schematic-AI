import { SemanticRole } from "./types";

export const inferSemanticRole = (
    column: string,
    type: string
): SemanticRole => {
    const name = column.toLowerCase()

    if (
        name.includes("id")
    ) {
        return "id"
    }
    if (
        name.includes("date") ||
        name.includes("time")
    ) {
        return type === "VARCHAR"
            ? "datetime"
            : "date"
    }
    if (
        name.includes("price") ||
        name.includes("amount") ||
        name.includes("revenue") ||
        name.includes("sales") ||
        name.includes("cost")
    ) {
        return "currency"
    }
    if (
        name.includes("%") ||
        name.includes("percent") ||
        name.includes("growth")
    ) {
        return "percentage"
    }
    if (
        name.includes("qty") ||
        name.includes("quantity")
    ) {
        return "quantity"
    }
    if (
        name.includes("country")
    ) {
        return "country"
    }
    if (
        name.includes("category") ||
        name.includes("type")
    ) {
        return "category"
    }
    if (
        name.includes("name")
    ) {
        return "name"
    }
    if (type === "VARCHAR") {
        return "text"
    }

    return "unknown"
}