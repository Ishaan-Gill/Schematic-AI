import { processFile } from "./processFile"

type HandleParsedUploadArgs<T> = {
    files: File[]
    onFileParsed: (tables: Awaited<ReturnType<typeof processFile>>) => Promise<T> | T
}

export const handleParsedFileUpload = async <T>({
    files,
    onFileParsed,
}: HandleParsedUploadArgs<T>) => {
    for (const file of files) {
        const parsed = await processFile(file)
        await onFileParsed(parsed)
    }
}
