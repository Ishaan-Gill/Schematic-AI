export const loadingStages = {
  understanding: "Understanding your question",
  checking: "Checking your data",
  analyzing: "Analyzing your data",
} as const

export type LoadingStage = keyof typeof loadingStages
