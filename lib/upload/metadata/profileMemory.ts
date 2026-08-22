export type ColumnProfile = {
    rowCount: number
    uniqueCount: number
    nullCount: number
    nullPercentage: number

    min?: number | string
    max?: number | string

    sampleValues?: unknown[]

    inferredType?: string

    currency?: string | null
    currencies?: string[]
    mixedCurrency?: boolean

    coercionFailedRows?: number
    coercionTargetType?: string
}

export type TableProfile = {
    [columnName: string]: ColumnProfile
}

export type ProfileMemory = {
    [tableName: string]: TableProfile
}