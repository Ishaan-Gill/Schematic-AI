"use client"

import React, { useEffect, useRef } from "react"

import { motion } from "framer-motion"
import { ArrowUp, Paperclip, Sparkles } from "lucide-react"

export default function FileUpload({
    query,
    setQuery,
    uploadError,
    setUploadError,
    loading,
    onSend,
    onFileChange,
}: {
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
    uploadError: string | null
    setUploadError: React.Dispatch<React.SetStateAction<string | null>>
    loading: boolean
    onSend: (query: string) => Promise<void>
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const MAX_HEIGHT = 120
    const resize = () => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "0px"
        const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT)
        el.style.height = `${newHeight}px`
        el.style.overflowY =
            el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden"
    }
    useEffect(() => {
        resize()
    }, [query])

    return (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-6 pb-6 pt-10 md:left-[220px]">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e] to-transparent" />
            <div className="mx-auto max-w-[860px]">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-end gap-3 rounded-[12px] border border-[#1c1e24] bg-[#111215] px-4 py-3 transition-all duration-200 focus-within:border-[rgba(79,255,176,0.4)] focus-within:shadow-[0_0_0_3px_rgba(79,255,176,0.06)]"
                >
                    <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[7px] text-[#6b7280] transition-colors duration-150 hover:text-[#e8eaf0]">
                        <Paperclip className="h-[18px] w-[18px]" aria-hidden="true" />
                        <input
                            type="file"
                            multiple
                            accept=".csv,.xlsx"
                            onChange={onFileChange}
                            className="sr-only"
                        />
                    </label>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            void onSend(query)
                        }}
                        className="flex w-full flex-col"
                    >
                        <textarea
                            ref={textareaRef}
                            value={query}
                            placeholder="Ask anything about your business data..."
                            rows={1}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                resize()
                                if (uploadError) setUploadError(null)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()

                                    if (!query.trim() || loading) return

                                    void onSend(query)
                                }
                            }}
                            className="
                                 w-full
                                min-h-[24px]
                                max-h-[120px]
                                overflow-y-auto
                                resize-none
                                border-0
                                bg-transparent
                                py-1
                                text-[14px]
                                leading-6
                                text-[#e8eaf0]
                                placeholder:text-[#6b7280]
                                focus:outline-none
                            "
                        />
                        <div className="mt-3 flex items-center justify-between">
                            <motion.button
                                type="submit"
                                disabled={loading || !query.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#4fffb0] text-[#0a0b0e] disabled:opacity-40"
                            >
                                {loading
                                    ? <Sparkles className="size-4 animate-pulse" />
                                    : <ArrowUp className="size-4" />
                                }
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
