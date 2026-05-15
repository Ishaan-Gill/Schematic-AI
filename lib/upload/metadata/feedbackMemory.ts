export type FeedbackEntry = {
    query: string
    generatedSQL: string
    outcome: "success" | "failure"
    error?: string
    timestamp: number
}

export const feedbackMemory: FeedbackEntry[] = []