import { bigIntReplacer } from "@/lib/chat/toJsonSafe";

type ValidateQueryResult = {
    rows: Record<string, unknown>[]
}
export function validateQueryResult({
    rows
}: ValidateQueryResult): string | null {

    if (rows.length > 1000) {
        return "Query returned too many rows."
    }
    const resultSize = JSON.stringify(rows, bigIntReplacer).length
    if (resultSize > 2_000_000) {
        return "Query result too large."
    }
    return null
}


