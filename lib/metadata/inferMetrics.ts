import { ColumnMetadata, DerivedMetric } from "./types"
import { quoteIdentifier } from "@/lib/utils/sqlHelpers"

export const inferMetrics = (
    metadata: ColumnMetadata[]
): DerivedMetric[] => {
    const metrics: DerivedMetric[] = []

    const quantityColumn =
        metadata.find(col =>
            col.semanticRole === "quantity"
        )

    const currencyColumn =
        metadata.find(col =>
            col.semanticRole === "currency"
        )

    if (
        quantityColumn &&
        currencyColumn
    ) {
        metrics.push({
            name: "revenue",
            expression: `${quoteIdentifier(quantityColumn.column)} * ${quoteIdentifier(currencyColumn.column)}`,
            confidence: 0.9
        })
    }

    return metrics
}