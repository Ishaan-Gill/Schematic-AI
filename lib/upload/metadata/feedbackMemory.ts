type FeedbackItem = {
    query: string
    generatedSQL: string
    outcome: "success" | "failure"
    timestamp: number
    error?: string
}

export const feedbackMemory: FeedbackItem[] = []