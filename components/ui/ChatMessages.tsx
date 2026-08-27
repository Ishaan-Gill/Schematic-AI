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
                <div
                    className="max-w-[70%] whitespace-pre-wrap rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] leading-[1.6]"
                    style={{
                        background: "#e8f0e9",
                        border: "1px solid rgba(21,115,71,0.2)",
                        color: "var(--ink)",
                        boxShadow: "2px 2px 0 rgba(21,115,71,0.08)",
                    }}
                >
                    {content}
                </div>
            ) : (
                <div className="flex w-full items-start gap-3">
                    <div
                        className="mt-0.5 flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
                        style={{
                            background: "#157347",
                            color: "#ffffff",
                            boxShadow: "2px 2px 0 rgba(21,115,71,0.2)",
                        }}
                    >
                        S
                    </div>

                    <div className="min-w-0 flex-1 whitespace-pre-wrap pt-0.5 text-[14px] leading-[1.75]" style={{ color: "var(--ink)" }}>
                        {content}
                    </div>
                </div>
            )}
        </motion.div>
    )
}
