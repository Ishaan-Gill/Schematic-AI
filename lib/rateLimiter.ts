const requests = new Map<string, {count: number; lastReset: number}>()

export function rateLimit(ip: string, limit = 5, windowMs = 60000) {
    const now = Date.now()

    if (!requests.has(ip)) {
        requests.set(ip, {count: 1, lastReset: now})
        return true
    }

    const data = requests.get(ip)!

    if (now - data.lastReset > windowMs) {
        requests.set(ip, {count: 1, lastReset: now})
        return true
    }

    if (data.count >= limit) {
        return false
    }

    data.count++
    return true
}