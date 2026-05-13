import { ColumnMetadata, DerivedMetric } from "./types"

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
            expression: `${quantityColumn.column} * ${currencyColumn.column}`,
            confidence: 0.9
        })
    }

    return metrics
}