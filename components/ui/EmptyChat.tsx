"use client"

import { motion } from "framer-motion"
import { useSyncExternalStore } from "react"
import { ArrowRight } from "lucide-react"

const emptySubscribe = () => () => {}

function getGreeting() {
  const hour = new Date().getHours()

  return hour < 12
    ? "Good Morning"
    : hour < 18
      ? "Good Afternoon"
      : "Good Evening"
}

const exampleQuestions = [
  "Why did revenue drop last month?",
  "Which products are driving growth?",
  "Which campaigns have the best ROI?",
]

type EmptyChatProps = {
  onExampleClick?: (question: string) => void
}

export default function EmptyChat({ onExampleClick }: EmptyChatProps) {
  const greeting = useSyncExternalStore(
    emptySubscribe,
    getGreeting,
    () => "Hello",
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="space-y-5 max-w-[580px]">
        {/* Schematic mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border-2 border-workspace-accent/25 bg-workspace-accent-soft shadow-[2px_2px_0_rgba(21,115,71,0.10)]"
        >
          <div className="grid h-6 w-6 grid-cols-2 grid-rows-2 gap-[3px]">
            <div className="rounded-[1px] bg-workspace-accent" />
            <div className="rounded-[1px] bg-workspace-accent/60" />
            <div className="rounded-[1px] bg-workspace-accent/40" />
            <div className="rounded-[1px] bg-workspace-accent/20" />
          </div>
        </motion.div>

        {/* Greeting */}
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-workspace-accent">
          {greeting}
        </p>

        {/* Main heading */}
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-workspace-text sm:text-[2.25rem]">
          What do you want to understand?
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-[440px] text-[14px] leading-6 text-workspace-text-secondary">
          Upload a dataset or ask a question. Schematic generates SQL,
          explores relationships, and gives you verified answers.
        </p>

        {/* Example questions */}
        <div className="pt-2">
          <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-workspace-text-muted">
            Try asking
          </p>
          <div className="flex flex-col gap-1.5">
            {exampleQuestions.map((q, i) => (
              <motion.button
                key={q}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
                onClick={() => onExampleClick?.(q)}
                className="group flex items-center gap-3 rounded-lg border border-workspace-border bg-workspace-surface-raised px-4 py-3 text-left shadow-[2px_2px_0_rgba(23,32,26,0.05)] transition-all duration-150 hover:border-workspace-accent/40 hover:bg-workspace-accent-soft/30 hover:shadow-[3px_3px_0_rgba(21,115,71,0.10)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-workspace-accent/20 bg-workspace-accent-soft text-workspace-accent">
                  <span className="font-mono text-[9px] font-semibold">{i + 1}</span>
                </span>
                <span className="flex-1 text-[13px] text-workspace-text-secondary group-hover:text-workspace-text">{q}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-workspace-text-muted transition-colors duration-150 group-hover:text-workspace-accent" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
