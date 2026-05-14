export const normalizeHeaders = (rawHeaders: string[]) => {
    const usedNames = new Set<string>()

    return rawHeaders.map((header, index) => {
        let cleaned = header
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "")

        if (!cleaned) {
            cleaned = `column_${index + 1}`
        }

        let finalName = cleaned
        let counter = 1

        while (usedNames.has(finalName)) {
            finalName = `${cleaned}_${counter}`
            counter += 1
        }

        usedNames.add(finalName)
        return finalName
    })
}
