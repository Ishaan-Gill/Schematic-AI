export const isFollowUpQuery = (query: string) => {
    const q = query.toLowerCase()
    return (
        q.includes("also") ||
        q.includes("now") ||
        q.includes("instead") ||
        q.includes("change") ||
        q.includes("for this") ||
        q.includes("same")
    )
}

export const isTimeQuery = (text: string) => {
    const t = text.toLowerCase()
    return (
        t.includes("month") ||
        t.includes("week") ||
        t.includes("year") ||
        t.includes("past") ||
        t.includes("recent")
    )
}
