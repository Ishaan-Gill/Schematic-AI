export type SemanticRole =
    | "id"
    | "date"
    | "datetime"
    | "currency"
    | "percentage"
    | "quantity"
    | "location"
    | "name"
    | "category"
    | "product"
    | "text"
    | "unknown"

export type ColumnMetadata = {
    column: string
    type: string
    semanticRole: SemanticRole
    nullable?: boolean
    uniqueRatio?: number
    detectedFormat?: string
    currency?: string | null
    currencies?: string[]
    mixedCurrency?: boolean
    coercionNote?: string
}

export type DerivedMetric = {
    name: string
    expression: string
    confidence: number
}