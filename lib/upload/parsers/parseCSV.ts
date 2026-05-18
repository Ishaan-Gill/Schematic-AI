import { normalizeTableName } from "../normalization/normalizeTableName"

import type { ParsedTable } from "./parseExcel"

export const parseCSV = async (
    file: File
): Promise<ParsedTable[]> => {

    const csvText = await file.text()

    return [
        {
            tableName: normalizeTableName(file.name),
            csvText,
        },
    ]
}