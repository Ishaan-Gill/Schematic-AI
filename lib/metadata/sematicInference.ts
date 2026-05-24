import {
    REVENUE_KEYWORDS,
    QUANTITY_KEYWORDS,
    CUSTOMER_KEYWORDS,
    DATE_KEYWORDS,
    PRODUCT_KEYWORDS,
    CATEGORY_KEYWORDS
} from "./semanticKeywords"

type SemanticContext = {
    revenueColumns: string[]
    quantityColumns: string[]
    customerColumns: string[]
    dateColumns: string[]
    productColumns: string[]
    categoryColumns: string[]
    identifierColumns: string[]
}

const includesAny = (
    value: string,
    keywords: string[]
) => {
    const lower = value.toLowerCase()

    return keywords.some(keyword =>
        lower.includes(keyword)
    )
}

export const semanticMemory: Record<string, SemanticContext> = {}

export const inferSemanticContext = (
    tableName: string,
    schema: any[],
    profile?: any
) => {
    const context: SemanticContext = {
        revenueColumns: [],
        quantityColumns: [],
        customerColumns: [],
        dateColumns: [],
        productColumns: [],
        categoryColumns: [],
        identifierColumns: []
    }


    // Use profile if available
    if (profile?.columnProfiles) {
        for (const [colName, stats] of Object.entries(profile.columnProfiles as any)) {
            const s = stats as any

            // Low cardinality = categorical
            if (s.uniqueCount <= 10 && !context.categoryColumns.includes(colName)) {
                context.categoryColumns.push(colName)
            }

            // All unique = likely identifier (fixed: If indetifierColumn contains NULL)
            const nullCount = s.nullCount ?? 0
            const nonNullRows = s.rowCount - nullCount
            if (
                s.uniqueCount === s.rowCount ||
                (nonNullRows > 0 && s.uniqueCount >= nonNullRows * 0.98)
            ) {
                if (!context.identifierColumns.includes(colName)) {
                    context.identifierColumns.push(colName)
                }
            }
        }
    }


    for (const column of schema) {

        const name = column.column_name.toLowerCase()
        const type = column.column_type.toLowerCase()

        // revenue
        if (
            includesAny(name, REVENUE_KEYWORDS)
        ) {
            context.revenueColumns.push(name)
        }

        // quantity
        if (
            includesAny(name, QUANTITY_KEYWORDS)
        ) {
            context.quantityColumns.push(name)
        }

        // customer
        if (
            includesAny(name, CUSTOMER_KEYWORDS)
        ) {
            context.customerColumns.push(name)
        }

        // dates
        if (
            type.includes("date") ||
            type.includes("time") ||
            includesAny(name, DATE_KEYWORDS)
        ) {
            context.dateColumns.push(name)
        }

        // product
        if (
            includesAny(name, PRODUCT_KEYWORDS)
        ) {
            context.productColumns.push(name)
        }

        // categorical
        const alreadyClassified = [
            ...context.revenueColumns,
            ...context.quantityColumns,
            ...context.customerColumns,
            ...context.dateColumns,
            ...context.productColumns,
        ]
        if (
            (type.includes("varchar") || type.includes("text")) &&
            !alreadyClassified.includes(name) &&
            includesAny(name, ["category", "type", "segment", "class", "group", "tier", "status"])
        ) {
            context.categoryColumns.push(name)
        }
    }

    semanticMemory[tableName] = context

    return context
}