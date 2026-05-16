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
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 210, damping: 24 }}
            className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
        >
            <motion.div
                whileHover={{ y: -1 }}
                className={`max-w-3xl border px-4 py-3 text-sm leading-6 shadow-2xl backdrop-blur whitespace-pre-wrap ${
                    isUser
                        ? "border-cyan-300/40 bg-cyan-300/90 text-zinc-950 shadow-cyan-950/20"
                        : "border-white/[0.08] bg-white/[0.04] text-zinc-100 shadow-black/30"
                }`}
            >
                {content}
            </motion.div>
        </motion.div>
    )
}
