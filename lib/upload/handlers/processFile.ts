import { parseCSV } from "../parsers/parseCSV"
import { parseExcel } from "../parsers/parseExcel"
import { validateFile } from "../validation/validateFile"

export const processFile = async (file: File) => {

    const fileError = validateFile({file})
    if (fileError) throw new Error(fileError)

    if (file.name.toLowerCase().endsWith(".csv")) {
        return parseCSV(file)
    }

    if (file.name.toLowerCase().endsWith(".xlsx")) {
        return parseExcel(file)
    }

    throw new Error(`Unsupported file type: ${file.name}`)
}
