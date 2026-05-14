import { normalizeHeaders } from "../normalization/normalizeHeaders"
import { normalizeTableName } from "../normalization/normalizeTableName"

import type { ParsedTable } from "./parseExcel"

export const parseCSV = async (file: File): Promise<ParsedTable[]> => {
    const csvText = await file.text()
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0)

    if (!lines.length) {
        return []
    }

    const headers = normalizeHeaders(lines[0].split(","))
    const rows = lines.slice(1).map((line) => {
        const values = line.split(",")

        return headers.reduce<Record<string, string | null>>((row, header, index) => {
            row[header] = values[index] ?? null
            return row
        }, {})
    })

    return [
        {
            tableName: normalizeTableName(file.name),
            headers,
            rows,
        },
    ]
}
