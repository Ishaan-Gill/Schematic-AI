import { NextResponse } from "next/server"
import { rateLimit } from "../rateLimiter"

export const checkRateLimit = (
    req: Request,
    limit: number,
    windowMs: number,
    message: string
) => {
    const ip =
        req.headers
            .get("x-forwarded-for")
            ?.split(",")[0]
            ?.trim() || "anonymous"

    if (!rateLimit(ip, limit, windowMs)) {
        return NextResponse.json(
            { error: message },
            { status: 429 }
        )
    }

    return null
}