"use client"

import { motion } from "framer-motion"
import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

function getGreeting() {
  const hour = new Date().getHours()

  return hour < 12
    ? "Good Morning"
    : hour < 18
      ? "Good Afternoon"
      : "Good Evening"
}

export default function EmptyChat() {
  const greeting = useSyncExternalStore(
    emptySubscribe,
    getGreeting,
    () => "Hello",
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="space-y-5">
        <p className="font-mono text-xl tracking-[0.2em] font-medium uppercase tracking-[0.18em] text-[#4fffb0]">
          {greeting}
        </p>

        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#f4f4f5]">
          What would you like to analyze?
        </h1>

        <p className="mx-auto max-w-[560px] font-sans text-[15px] leading-7 text-[#71717a]">
          Upload a dataset or ask a question about your business data.
          Generate SQL, explore relationships, and uncover insights with
          transparent, verifiable answers.
        </p>
      </div>
    </motion.div>
  )
}