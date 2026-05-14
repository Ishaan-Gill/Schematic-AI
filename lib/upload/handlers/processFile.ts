import { parseCSV } from "../parsers/parseCSV"
import { parseExcel } from "../parsers/parseExcel"

export const processFile = async (file: File) => {
    if (file.name.endsWith(".csv")) {
        return parseCSV(file)
    }

    if (file.name.endsWith(".xlsx")) {
        return parseExcel(file)
    }

    throw new Error(`Unsupported file type: ${file.name}`)
}
