export type ColumnProfile = {
    totalRows: number
    nonNullRows: number
    uniqueValues: number

    nullPercentage?: number

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

export const profileMemory: ProfileMemory = {}