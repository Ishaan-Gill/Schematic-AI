type ValidateQueryResult = {
    rows: Record<string, unknown>[]
}
export function validateQueryResult({
    rows
}: ValidateQueryResult): string | null {

    if (rows.length > 1000) {
        return "Query returned too many rows."
    }
    const resultSize = JSON.stringify(rows, (_, value) =>
        typeof value === "bigint"
            ? value.toString()
            : value
    ).length
    if (resultSize > 2_000_000) {
        return "Query result too large."
    }
    return null
}


