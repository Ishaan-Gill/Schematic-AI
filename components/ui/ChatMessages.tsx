"use client"

import { motion } from "framer-motion"

export type ChatMessageProps = {
    role: "user" | "assistant"
    content: string
}

export default function ChatMessage({
    role,
    content
}: ChatMessageProps) {
    const isUser = role === "user"

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`mx-auto w-full max-w-[860px] flex ${isUser ? "justify-end" : "justify-start"}`}
        >
            {isUser ? (
                <div className="max-w-[80%] whitespace-pre-wrap rounded-[16px_16px_4px_16px] border border-[#2a2d35] bg-[#1a1d24] px-4 py-3 font-sans text-[14px] leading-[1.7] text-[#e8eaf0]">
                    {content}
                </div>
            ) : (
                <div className="flex w-full items-start gap-3">
                    <div className="mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] border border-[rgba(79,255,176,0.25)] bg-[rgba(79,255,176,0.1)] font-mono text-[10px] text-[rgba(79,255,176,0.8)]">
                        S
                    </div>

                    <div className="min-w-0 flex-1 whitespace-pre-wrap font-sans text-[14px] leading-[1.8] text-[#e8eaf0]">
                        {content}
                    </div>
                </div>
            )}
        </motion.div>
    )
}
