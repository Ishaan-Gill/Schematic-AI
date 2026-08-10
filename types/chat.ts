import { type LoadingStage } from "@/lib/chat/loadingStages"

export type Session = {
  id: string;
  title: string;
  messages: Message[];
};

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  generatedSQL?: string
  queryResult?: Record<string, unknown>[]
  loading?: boolean
  loadingStage?: LoadingStage
  error?: string
  page?: number
  hasMore?: boolean
  warnings?: string[]
  normalizationNotes?: string[]
  timestamp: string
}