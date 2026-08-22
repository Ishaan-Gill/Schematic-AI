import { inferSemanticRole } from "./inferSemanticRole"
import { inferDateFormat } from "./inferDateFormat"
import { inferMetrics } from "./inferMetrics"
import { ColumnMetadata } from "./types"
import type { TableProfile } from "../upload/metadata/profileMemory"

export const buildDatasetContext = (
    schemas: Record<string, any[]>,
    sampleRowsByTable: Record<string, any[]>,
    profilesByTable?: Record<string, TableProfile>,
) => {
    const tableContexts: Record<string, any> = {}

    for (const [tableName, schema] of Object.entries(schemas)) {
        const sampleRows = sampleRowsByTable[tableName] ?? []
        const profile = profilesByTable?.[tableName]

        const metadata: ColumnMetadata[] = schema.map(column => {
            const samples = sampleRows
                ?.slice(0, 50)
                ?.map(r => r[column.column_name])
                ?.filter(
                    (v): v is string =>
                        typeof v === "string" && v !== null && v !== undefined && v !== "",
                )
            const columnProfile = profile?.[column.column_name]
            return {
                column: column.column_name,
                type: column.column_type,
                semanticRole: inferSemanticRole(column.column_name, column.column_type),
                detectedFormat: samples.length > 0
                    ? samples.filter(v => v.includes("%")).length / samples.length >= 0.5
                        ? "percent (stored as fraction 0-1)"
                        : inferDateFormat(samples) ?? undefined
                    : undefined,
                currency: columnProfile?.currency ?? null,
                currencies: columnProfile?.currencies ?? [],
                mixedCurrency: columnProfile?.mixedCurrency ?? false,
            }
        })

        tableContexts[tableName] = {
            metadata,
            metrics: inferMetrics(metadata)
        }
    }

    return tableContexts
}