"use client"

import { motion } from "framer-motion"
import type { ToastItem } from "@/types/toast"

type ToastProps = {
    toast: ToastItem
}

export default function Toast({
    toast,
}: ToastProps) {
    const border =
        toast.type === "success"
            ? "border-green-500/30"
            : toast.type === "error"
                ? "border-red-500/30"
                : "border-blue-500/30"

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
                rounded-xl
                border
                ${border}
                bg-[#111318]
                px-5
                py-3
                text-sm
                text-white
                shadow-xl
                backdrop-blur-md
            `}
        >
            {toast.message}
        </motion.div>
    )
}