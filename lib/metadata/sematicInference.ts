type SemanticContext = {
    revenueColumns: string[]
    quantityColumns: string[]
    customerColumns: string[]
    dateColumns: string[]
    productColumns: string[]
    categoryColumns: string[]
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
    }

    for (const column of schema) {

        const name = column.column_name.toLowerCase()
        const type = column.column_type.toLowerCase()

        // revenue
        if (
            includesAny(name, [
                "revenue",
                "sales",
                "amount",
                "total",
                "price",
                "income"
            ])
        ) {
            context.revenueColumns.push(name)
        }

        // quantity
        if (
            includesAny(name, [
                "qty",
                "quantity",
                "units",
                "count"
            ])
        ) {
            context.quantityColumns.push(name)
        }

        // customer
        if (
            includesAny(name, [
                "customer",
                "client",
                "buyer",
                "user"
            ])
        ) {
            context.customerColumns.push(name)
        }

        // dates
        if (
            type.includes("date") ||
            type.includes("time") ||
            includesAny(name, [
                "date",
                "created",
                "invoice",
                "timestamp"
            ])
        ) {
            context.dateColumns.push(name)
        }

        // product
        if (
            includesAny(name, [
                "product",
                "item",
                "sku",
                "stock",
                "description"
            ])
        ) {
            context.productColumns.push(name)
        }

        // categorical
        if (
            type.includes("varchar") ||
            type.includes("text")
        ) {
            context.categoryColumns.push(name)
        }
    }

    semanticMemory[tableName] = context

    return context
}