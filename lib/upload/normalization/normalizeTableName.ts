export const normalizeTableName = (fileName: string) =>
    fileName
        .replace(/\.[^.]+$/i, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase() || "table"
