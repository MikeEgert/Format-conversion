export function createRateLimiter({ windowMs, max, now = () => Date.now() }) {
  const hits = new Map()

  function prune(key, time) {
    const cutoff = time - windowMs
    const timestamps = hits.get(key)
    if (!timestamps) return
    const kept = timestamps.filter((t) => t > cutoff)
    if (kept.length === 0) hits.delete(key)
    else hits.set(key, kept)
  }

  let lastSweep = 0

  function sweep(time) {
    for (const key of hits.keys()) prune(key, time)
    lastSweep = time
  }

  function isLimited(key, time = now()) {
    if (time - lastSweep > windowMs) sweep(time)

    const cutoff = time - windowMs
    const kept = (hits.get(key) ?? []).filter((t) => t > cutoff)
    kept.push(time)
    hits.set(key, kept)
    return kept.length > max
  }

  return { isLimited, size: () => hits.size }
}
