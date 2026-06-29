"use client"

import { AnimatePresence } from "framer-motion"
import { useEffect } from "react"

import Toast from "./Toast"

import type { ToastItem } from "@/types/toast"

type ToastContainerProps = {
    toasts: ToastItem[]
    setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>>
}

export default function ToastContainer({
    toasts,
    setToasts,
}: ToastContainerProps) {

    useEffect(() => {
        if (toasts.length === 0) return

        const timer = setTimeout(() => {
            setToasts(prev => prev.slice(1))
        }, 3500)

        return () => clearTimeout(timer)
    }, [toasts, setToasts])

    return (
        <div className="pointer-events-none fixed left-1/2 top-6 z-50 flex -translate-x-1/2 flex-col gap-3">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}