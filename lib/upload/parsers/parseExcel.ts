import * as XLSX from "xlsx"

export type ParsedTable = {
    tableName: string
    headers: string[]
    rows: any[]
}

export const parseExcel = async (
    file: File
): Promise<ParsedTable[]> => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, {
        type: "array"
    })
    const tables: ParsedTable[] = []

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, {
            defval: null
        })
        if (!rows.length) continue

        const headers = Object.keys(rows[0] as object)

        tables.push({
            tableName: sheetName,
            headers,
            rows
        })
    }
    return tables
}