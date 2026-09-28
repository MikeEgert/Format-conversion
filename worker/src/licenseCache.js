export function createLicenseCache({ cache = caches.default, now = Date.now } = {}) {
  async function cacheUrlFor(licenseKey) {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(licenseKey),
    )
    const hex = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return `https://license-cache.local/${hex}`
  }

  async function read(licenseKey) {
    const cacheUrl = await cacheUrlFor(licenseKey)
    try {
      const cached = await cache.match(cacheUrl)
      if (!cached) return null
      const body = await cached.json()
      const expiresAt = typeof body.expiresAt === 'number' ? body.expiresAt : 0
      if (expiresAt <= now()) {
        await cache.delete(cacheUrl)
        return null
      }
      return body
    } catch {
      // caching is best-effort
      return null
    }
  }

  async function write(licenseKey, body, ttlSeconds) {
    const cacheUrl = await cacheUrlFor(licenseKey)
    try {
      const response = new Response(
        JSON.stringify({ ...body, expiresAt: now() + ttlSeconds * 1000 }),
        { headers: { 'Content-Type': 'application/json' } },
      )
      await cache.put(cacheUrl, response)
    } catch {
      // caching is best-effort
    }
  }

  return { read, write }
}