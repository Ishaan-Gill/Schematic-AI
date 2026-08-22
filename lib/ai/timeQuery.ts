const pad = (n: number) => String(n).padStart(2, "0")

const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const addDays = (d: Date, days: number): Date => {
    const r = new Date(d)
    r.setDate(r.getDate() + days)
    return r
}

const startOfWeek = (d: Date): Date => {
    // Monday-based week
    const day = d.getDay()
    const diff = (day + 6) % 7
    return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -diff)
}

export const getLocalDateString = (): string => fmtDate(new Date())

export const getCurrentDateHint = (): string => {
    const now = new Date()
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" })
    const quarter = Math.floor(now.getMonth() / 3) + 1
    return `Today's date is ${weekday} ${fmtDate(now)}. Current quarter: Q${quarter} ${now.getFullYear()}.`
}

// Resolves time-relative phrases against the real calendar so the LLM
// never has to guess the current date from its training data
export const getRelativeWindowHint = (query: string): string => {
    if (!isTimeQuery(query)) {
        return ""
    }

    const t = query.toLowerCase()
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const windows: string[] = []

    const push = (label: string, from: Date, to: Date) =>
        windows.push(`"${label}" = ${fmtDate(from)} to ${fmtDate(to)}`)

    if (t.includes("this month")) {
        push("this month", new Date(y, m, 1), new Date(y, m + 1, 0))
    }
    if (t.includes("last month")) {
        push("last month", new Date(y, m - 1, 1), new Date(y, m, 0))
    }
    if (t.includes("this year")) {
        push("this year", new Date(y, 0, 1), new Date(y, 11, 31))
    }
    if (t.includes("last year")) {
        push("last year", new Date(y - 1, 0, 1), new Date(y - 1, 11, 31))
    }
    if (t.includes("ytd")) {
        push("ytd", new Date(y, 0, 1), now)
    }
    if (t.includes("this week")) {
        const start = startOfWeek(now)
        push("this week", start, addDays(start, 6))
    }
    if (t.includes("last week")) {
        const start = addDays(startOfWeek(now), -7)
        push("last week", start, addDays(start, 6))
    }
    if (t.includes("past 30")) {
        push("past 30 days", addDays(now, -29), now)
    }
    if (t.includes("past 90")) {
        push("past 90 days", addDays(now, -89), now)
    }
    if (t.includes("recent") || t.includes("latest")) {
        push("recent/latest", addDays(now, -30), now)
    }
    if (t.includes("quarter")) {
        const qStartMonth = Math.floor(m / 3) * 3
        push(
            "current quarter",
            new Date(y, qStartMonth, 1),
            new Date(y, qStartMonth + 3, 0),
        )
    }

    if (windows.length === 0) {
        return ""
    }

    return `Resolved relative windows (user's local timezone):\n${windows
        .map((w) => `  - ${w}`)
        .join("\n")}`
}

export const isTimeQuery = (query: string): boolean => {
    const t = query.toLowerCase()
    return (
        t.includes("this month") ||
        t.includes("last month") ||
        t.includes("this year") ||
        t.includes("last year") ||
        t.includes("this week") ||
        t.includes("last week") ||
        t.includes("past 30") ||
        t.includes("past 90") ||
        t.includes("recent") ||
        t.includes("latest") ||
        t.includes("ytd") ||
        t.includes("quarter")
    )
}
