export type SchemaColumn = {
    column_name: string
    column_type: string
}

export type SchemaMemory = {
    [tableName: string]: SchemaColumn[]
}