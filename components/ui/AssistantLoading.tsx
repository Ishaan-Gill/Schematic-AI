"use client"

import { AnimatePresence, motion } from "framer-motion"
import { loadingStages, type LoadingStage } from "@/lib/chat/loadingStages"

type AssistantLoadingProps = {
  stage: LoadingStage
}

export default function AssistantLoading({ stage }: AssistantLoadingProps) {
  return (
    <span className="flex h-7 items-center gap-2.5">
      <span className="relative flex items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-[13px] font-medium text-workspace-text-secondary"
          >
            {loadingStages[stage]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-[5px] w-[5px] rounded-full bg-workspace-accent"
            style={{
              animation: "thinking 1.4s ease-in-out infinite",
              animationDelay: `${index * 0.16}s`,
            }}
          />
        ))}
      </span>
    </span>
  )
}
