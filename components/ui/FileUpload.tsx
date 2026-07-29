"use client"

import React, { useState, useEffect, useRef } from "react"

import { motion } from "framer-motion"
import { ArrowUp, Paperclip, Sparkles } from "lucide-react"

export default function FileUpload({
    query,
    setQuery,
    isSending,
    isUploading,
    onSend,
    onFileChange,
    onFilesSelected,
    className,
}: {
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
    isSending: boolean
    isUploading: boolean
    onSend: (query: string) => Promise<void>
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    onFilesSelected?: (files: File[]) => Promise<void>
    className?: string
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [isDragOver, setIsDragOver] = useState(false)
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.effectAllowed = "copy"
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const files = Array.from(e.dataTransfer.files)
        if (!files.length) return
        onFilesSelected?.(files)
    }

    return (
        <div className={className}>
            <div className="mx-auto w-full max-w-[860px]">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex items-end gap-3 rounded-[12px] border px-4 py-3 transition-all duration-200 focus-within:border-[rgba(79,255,176,0.4)] focus-within:shadow-[0_0_0_3px_rgba(79,255,176,0.06)] ${isDragOver
                        ? "border-[#4fffb0] bg-[rgba(79,255,176,0.04)] shadow-[0_0_0_3px_rgba(79,255,176,0.10)]"
                        : "border-[#1c1e24] bg-[#111215]"
                    }`}
                >
                    {isDragOver && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[12px] bg-[rgba(17,18,21,0.85)]">
                            <span className="text-[15px] font-medium text-[#4fffb0]">
                                Drop your file here
                            </span>
                        </div>
                    )}
                    <label className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[7px] text-[#6b7280] transition-colors duration-150 hover:text-[#e8eaf0] ${isUploading ? "pointer-events-none opacity-40" : ""}`}>
                        <Paperclip className="h-[18px] w-[18px]" aria-hidden="true" />
                        <input
                            type="file"
                            multiple
                            accept=".csv,.xlsx"
                            onChange={onFileChange}
                            disabled={isUploading}
                            className="sr-only"
                        />
                    </label>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            const currentQuery = query
                            setQuery("")
                            textareaRef.current?.focus()
                            void onSend(currentQuery)
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
                            }}
                                onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()

                                    if (!query.trim() || isSending || isUploading) return

                                    const currentQuery = query
                                    setQuery("")
                                    textareaRef.current?.focus()
                                    void onSend(currentQuery)
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
                                disabled={isSending || isUploading || !query.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#4fffb0] text-[#0a0b0e] disabled:opacity-40"
                            >
                                {isSending || isUploading
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
