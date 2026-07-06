export const isTimeQuery = (query: string): boolean => {
    const t = query.toLowerCase()
    return (
        t.includes("this month") ||
        t.includes("last month") ||
        t.includes("this year") ||
        t.includes("last year") ||
        t.includes("this week") ||
        t.includes("last week") ||
        t.includes("past 30") ||
        t.includes("past 90") ||
        t.includes("recent") ||
        t.includes("latest") ||
        t.includes("ytd") ||
        t.includes("quarter")
    )
}
