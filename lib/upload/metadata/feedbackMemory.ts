type FeedbackItem = {
    query: string
    generatedSQL: string
    outcome: "success" | "failure"
    timestamp: number
    error?: string
}

export const feedbackMemory: FeedbackItem[] = []

export const addFeedbackMemory = (entry: FeedbackItem) => {
    const alreadyExists = feedbackMemory.some(
        (item) =>
            item.query === entry.query &&
            item.generatedSQL === entry.generatedSQL &&
            item.outcome === entry.outcome
    )

    if (alreadyExists) return

    feedbackMemory.push(entry)

    if (feedbackMemory.length > 50) {
        feedbackMemory.shift()
    }
}