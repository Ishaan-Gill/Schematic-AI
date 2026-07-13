const requests = new Map<string, { count: number; lastReset: number }>()

const MAX_TRACKED_IPS = 1000

function pruneExpiredEntries(now: number, windowMs: number) {
    for (const [ip, data] of requests) {
        if (now - data.lastReset > windowMs) {
            requests.delete(ip)
        }
    }
}

export function rateLimit(
    ip: string,
    bucket: string,
    limit = 5,
    windowMs = 60000
) {
    const now = Date.now()

    const key = `${ip}:${bucket}`

    pruneExpiredEntries(now, windowMs)

    if (!requests.has(key)) {

        if (requests.size >= MAX_TRACKED_IPS) {
            const oldestEntry = requests.keys().next().value

            if (oldestEntry) {
                requests.delete(oldestEntry)
            }
        }
        requests.set(key, {
            count: 1,
            lastReset: now
        })
        return true
    }
    const data = requests.get(key)!

    if (now - data.lastReset > windowMs) {
        requests.set(key, {
            count: 1,
            lastReset: now
        })
        return true
    }

    if (data.count >= limit) return false

    data.count++
    return true
}