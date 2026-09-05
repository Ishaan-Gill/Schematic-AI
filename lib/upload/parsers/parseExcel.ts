import { normalizeTableName } from "../normalization/normalizeTableName"
import { MAX_FILE_SIZE, validateFile } from "../validation/validateFile"
import * as XLSX from "xlsx"

export type ParsedTable = {
    tableName: string
    headers?: string[]
    csvText: string
}

export const parseExcel = async (
    file: File
): Promise<ParsedTable[]> => {
    // Cheap checks before reading the full file into memory.
    const fileError = validateFile({ file })
    if (fileError) throw new Error(fileError)
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(
            `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        )
    }

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

    if (tables.length === 0) {
        throw new Error(
            "This workbook contains no usable sheets. Add data to at least one sheet and try again."
        )
    }

    return tables
}