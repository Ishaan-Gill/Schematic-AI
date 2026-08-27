"use client"

import { motion } from "framer-motion"
import { CheckCircle, XCircle, Info } from "lucide-react"
import type { ToastItem } from "@/types/toast"

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
} as const

const styles = {
    success: {
        border: "border-green-500/25",
        icon: "text-green-600",
        bg: "bg-green-50",
    },
    error: {
        border: "border-red-500/25",
        icon: "text-red-600",
        bg: "bg-red-50",
    },
    info: {
        border: "border-blue-500/25",
        icon: "text-blue-600",
        bg: "bg-blue-50",
    },
} as const

type ToastProps = {
    toast: ToastItem
}

export default function Toast({
    toast,
}: ToastProps) {
    const Icon = iconMap[toast.type]
    const style = styles[toast.type]

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
                rounded-xl
                border
                ${style.border}
                ${style.bg}
                bg-workspace-surface-raised
                px-5
                py-3
                text-sm
                shadow-[4px_4px_0_rgba(23,32,26,0.08)]
                min-w-[300px]
                max-w-[420px]
            `}
        >
            <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 size-5 shrink-0 ${style.icon}`} />
                <div className="min-w-0">
                    {toast.title && (
                        <p className="font-semibold text-workspace-text">
                            {toast.title}
                        </p>
                    )}
                    <p className={toast.title ? "text-workspace-text-secondary" : "text-workspace-text"}>
                        {toast.message}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
