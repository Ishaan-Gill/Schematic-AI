import { ColumnMetadata } from "./types"

type CategoryInfo = {
    column: string
    topValues: string[]
    distinctCount: number
}

export const inferCategories = (
    metadata: ColumnMetadata[],
    sampleRows: any[]
): CategoryInfo[] => {
    const categories: CategoryInfo[] = []

    for (const column of metadata) {
        const isCategorical =
            column.semanticRole === "category" ||
            column.semanticRole === "country" ||
            column.semanticRole === "text"

        if (!isCategorical) continue

        const values = sampleRows
            .map(row => row[column.column])
            .filter(Boolean)
            .map(value => String(value).toLowerCase().trim())

        if (values.length === 0) continue

        const frequencyMap = new Map<string, number>()

        for (const value of values) {
            frequencyMap.set(
                value,
                (frequencyMap.get(value) ?? 0) + 1
            )
        }

        const sorted = [...frequencyMap.entries()]
            .sort((a, b) => b[1] - a[1])

        categories.push({
            column: column.column,
            topValues: sorted
                .slice(0, 10)
                .map(([value]) => value),
            distinctCount: frequencyMap.size
        })
    }

    return categories
}