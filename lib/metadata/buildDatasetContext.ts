import { inferSemanticRole } from "./inferSemanticRole"
import { inferDateFormat } from "./inferDateFormat"
import { inferMetrics } from "./inferMetrics"
import { ColumnMetadata } from "./types"

export const buildDatasetContext = (
    schemas: Record<string, any[]>,
    sampleRowsByTable: Record<string, any[]>
) => {
    const tableContexts: Record<string, any> = {}

    for (const [tableName, schema] of Object.entries(schemas)) {
        const sampleRows = sampleRowsByTable[tableName] ?? []

        const metadata: ColumnMetadata[] = schema.map(column => {
            const samples = sampleRows
                ?.slice(0, 50)
                ?.map(r => r[column.column_name])
                ?.filter(
                    (v): v is string =>
                        typeof v === "string" && v !== null && v !== undefined && v !== "",
                )
            return {
                column: column.column_name,
                type: column.column_type,
                semanticRole: inferSemanticRole(column.column_name, column.column_type),
                detectedFormat: samples.length > 0
                    ? inferDateFormat(samples) ?? undefined
                    : undefined,
            }
        })

        tableContexts[tableName] = {
            metadata,
            metrics: inferMetrics(metadata)
        }
    }

    return tableContexts
}