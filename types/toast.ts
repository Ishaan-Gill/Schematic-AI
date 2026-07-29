export type ToastItem = {
    id: string
    type: "success" | "error" | "info"
    title?: string
    message: string
}