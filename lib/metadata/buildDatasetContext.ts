import { inferSemanticRole } from "./inferSemanticRole"
import { inferDateFormat } from "./inferDateFormat"
import { inferMetrics } from "./inferMetrics"
import { ColumnMetadata } from "./types"
import { inferCategories } from "./inferCategories"
import { BUSINESS_METRICS } from "./defaultBusinessMetrics"

export const buildDatasetContext = (
    schema: any[],
    sampleRows: any[]
) => {
    const metadata: ColumnMetadata[] =
        schema.map(column => {
            const sample = sampleRows?.[0]?.[column.column_name]

            return {
                column: column.column_name,
                type: column.column_type,
                semanticRole: inferSemanticRole(
                    column.column_name,
                    column.column_type
                ),
                detectedFormat:
                    typeof sample === "string"
                        ? inferDateFormat(sample) ?? undefined
                        : undefined,
                sampleValues: sampleRows
                    ?.slice(0, 3)
                    .map(row => row[column.column_name])
            }
        })

    const metrics = inferMetrics(metadata)
    const categories = inferCategories(metadata, sampleRows)

    return {
        metadata,
        metrics,
        categories,
        BUSINESS_METRICS
    }
}