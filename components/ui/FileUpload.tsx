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
                    className={`relative flex items-end gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-150 ${
                        isDragOver
                            ? "border-workspace-accent bg-workspace-accent-soft/40 shadow-[0_0_0_4px_rgba(21,115,71,0.12)]"
                            : "border-workspace-border-strong bg-workspace-surface-raised shadow-[4px_4px_0_rgba(23,32,26,0.08)] focus-within:border-workspace-accent/50 focus-within:shadow-[4px_4px_0_rgba(21,115,71,0.12),0_0_0_3px_rgba(21,115,71,0.08)]"
                    }`}
                >
                    {isDragOver && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-workspace-surface-raised/90">
                            <span className="text-[14px] font-medium text-workspace-accent">
                                Drop your file here
                            </span>
                        </div>
                    )}
                    <label className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-workspace-text-muted transition-colors duration-150 hover:bg-workspace-surface-sunken hover:text-workspace-accent ${isUploading ? "pointer-events-none opacity-40" : ""}`}>
                        <Paperclip className="h-4 w-4" aria-hidden="true" />
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
                                text-workspace-text
                                placeholder:text-workspace-text-muted
                                focus:outline-none
                            "
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <motion.button
                                type="submit"
                                disabled={isSending || isUploading || !query.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-workspace-accent text-white shadow-[2px_2px_0_rgba(23,32,26,0.15)] transition-all duration-150 hover:bg-workspace-accent-dark hover:shadow-[3px_3px_0_rgba(23,32,26,0.18)] disabled:opacity-40 disabled:hover:bg-workspace-accent disabled:hover:shadow-[2px_2px_0_rgba(23,32,26,0.15)]"
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
