const MAX_FILE_SIZE = 50 * 1024 * 1024

type ValidateFileArgs = {
    file: File
}

export const validateFile = ({
    file,
}: ValidateFileArgs) => {
    if (!file.size) {
        throw new Error("Empty file.")
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    const extensions = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["csv", "xlsx"]

    if (!extensions || !allowedExtensions.includes(extensions)) {
        throw new Error("Unsupported file type. Only CSV and XLSX files are supported.")
    }
}
