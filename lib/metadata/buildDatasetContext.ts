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
            const sample = sampleRows
                ?.slice(0, 5)
                ?.map(r => r[column.column_name])
                ?.find(v => v !== null && v !== undefined && v !== "")
            return {
                column: column.column_name,
                type: column.column_type,
                semanticRole: inferSemanticRole(column.column_name, column.column_type),
                detectedFormat: typeof sample === "string"
                    ? inferDateFormat(sample) ?? undefined
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