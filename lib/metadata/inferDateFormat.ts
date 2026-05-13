export const inferDateFormat = (
    sample: string
): string | null => {
    if (!sample) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(sample)) {
        return "%Y-%m-%d"
    }
    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(sample)
    ) {
        return "%m/%d/%Y"
    }
    if (
        /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(sample)
    ) {
        return "%m/%d/%Y %H:%M"
    }

    return null
}