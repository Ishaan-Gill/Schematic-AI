import { normalizeTableName } from "../normalization/normalizeTableName"
import * as XLSX from "xlsx"

export type ParsedTable = {
    tableName: string
    headers?: string[]
    csvText: string
}

export const parseExcel = async (
    file: File
): Promise<ParsedTable[]> => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, {
        type: "array"
    })
    const tables: ParsedTable[] = []

    // Converts .xlsx to .csv for duckdb ingestion.
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]

        const csvText = XLSX.utils.sheet_to_csv(sheet)

        if (!csvText.trim()) continue

        const [headerLine] = csvText.split(/\r?\n/)

        const headers = headerLine
            .split(",")
            .map((header) => header.trim())

        tables.push({
            tableName: normalizeTableName(sheetName),
            headers,
            csvText
        })
    }
    return tables
}