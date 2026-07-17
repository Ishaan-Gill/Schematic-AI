export type ColumnProfile = {
    rowCount: number
    uniqueCount: number
    nullCount: number
    nullPercentage: number

    min?: number | string
    max?: number | string

    sampleValues?: unknown[]

    inferredType?: string
}

export type TableProfile = {
    [columnName: string]: ColumnProfile
}

export type ProfileMemory = {
    [tableName: string]: TableProfile
}