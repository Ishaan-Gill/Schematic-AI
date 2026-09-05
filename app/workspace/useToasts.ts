"use client";

import { useCallback, useState } from "react";
import { ToastItem } from "@/types/toast";

export type ShowToast = (
  type: ToastItem["type"],
  message: string,
  title?: string,
) => void;

// Toast state shared by workspace boot, uploads, chat, and session/dataset
// actions. Rendering stays with the page (ToastContainer).
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast: ShowToast = useCallback((type, message, title) => {
    setToasts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        title,
        message,
      },
    ]);
  }, []);

  return { toasts, setToasts, showToast };
}
