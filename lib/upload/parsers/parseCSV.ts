import { normalizeTableName } from "../normalization/normalizeTableName"
import { MAX_FILE_SIZE, validateFile } from "../validation/validateFile"

import type { ParsedTable } from "./parseExcel"

export const parseCSV = async (
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

    const csvText = await file.text()

    if (!csvText.trim()) {
        throw new Error("This file appears to be empty.")
    }

    return [
        {
            tableName: normalizeTableName(file.name),
            csvText,
        },
    ]
}