const requests = new Map<string, { count: number; lastReset: number }>()
const MAX_TRACKED_IPS = 1000

function pruneExpiredEntries(now: number, windowMs: number) {
    for (const [ip, data] of requests) {
        if (now - data.lastReset > windowMs) {
            requests.delete(ip)
        }
    }
}

export function rateLimit(ip: string, limit = 5, windowMs = 60000) {
    const now = Date.now()
    pruneExpiredEntries(now, windowMs)

    if (!requests.has(ip)) {
        if (requests.size >= MAX_TRACKED_IPS) {
            const oldestEntry = requests.entries().next().value
            if (oldestEntry) {
                requests.delete(oldestEntry[0])
            }
        }

        requests.set(ip, { count: 1, lastReset: now })
        return true
    }

    const data = requests.get(ip)!

    if (now - data.lastReset > windowMs) {
        requests.set(ip, { count: 1, lastReset: now })
        return true
    }

    if (data.count >= limit) {
        return false
    }

    data.count++
    return true
}
