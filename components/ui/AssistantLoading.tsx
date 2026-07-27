"use client"

import { AnimatePresence, motion } from "framer-motion"
import { loadingStages, type LoadingStage } from "@/lib/chat/loadingStages"

type AssistantLoadingProps = {
  stage: LoadingStage
}

export default function AssistantLoading({ stage }: AssistantLoadingProps) {
  return (
    <span className="flex h-7 items-center gap-2">
      <span className="relative">
        <AnimatePresence mode="wait">
          <motion.span
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-[13px] text-[#6b7280]"
          >
            {loadingStages[stage]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-[#4fffb0]"
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
