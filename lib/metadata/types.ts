export type SemanticRole =
    | "id"
    | "date"
    | "datetime"
    | "currency"
    | "percentage"
    | "quantity"
    | "country"
    | "name"
    | "category"
    | "text"
    | "unknown"

export type ColumnMetadata = {
    column: string
    type: string
    semanticRole: SemanticRole
    nullable?: boolean
    uniqueRatio?: number
    sampleValues?: any[]
    detectedFormat?: string
}

export type DerivedMetric = {
    name: string
    expression: string
    confidence: number
}