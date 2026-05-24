export const isFollowUpQuery = (
    query: string,
    lastSQL: string | null
): boolean => {

    // No previous SQL = impossible to follow up
    if (!lastSQL?.trim()) {
        return false
    }

    const q = query.toLowerCase().trim()

    const followUpPhrases = [
        "now filter",
        "now show",
        "now group",
        "instead show",
        "change it to",
        "do the same",
        "for those",
        "from those",
        "of those",
        "add a filter",
        "but only",
        "exclude",
        "narrow it down",
        "sort it by",
        "group it by"
    ]

    return followUpPhrases.some(
        phrase => q.includes(phrase)
    )
}

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