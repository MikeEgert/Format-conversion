import { describe, expect, it } from 'vitest'
import { createLicenseCache } from './licenseCache'

function fakeCache() {
  const store = new Map()
  return {
    async match(url) {
      const entry = store.get(String(url))
      return entry ? entry.clone() : undefined
    },
    async put(url, response) {
      store.set(String(url), response)
    },
    async delete(url) {
      return store.delete(String(url))
    },
    size: () => store.size,
  }
}

describe('createLicenseCache', () => {
  it('serves a cached body within its TTL', async () => {
    let t = 1_000
    const cache = fakeCache()
    const licenseCache = createLicenseCache({ cache, now: () => t })
    await licenseCache.write('key-1', { valid: true, status: 'active' }, 300)
    expect(await licenseCache.read('key-1')).toMatchObject({
      valid: true,
      status: 'active',
    })
  })

  it('treats a hit past the TTL as expired and evicts it', async () => {
    let t = 1_000
    const cache = fakeCache()
    const licenseCache = createLicenseCache({ cache, now: () => t })
    await licenseCache.write('key-1', { valid: true, status: 'active' }, 300)
    t = 1_000 + 300_000 + 1
    expect(await licenseCache.read('key-1')).toBeNull()
    expect(cache.size()).toBe(0)
  })

  it('returns null for a cache miss', async () => {
    const licenseCache = createLicenseCache({ cache: fakeCache(), now: () => 1 })
    expect(await licenseCache.read('missing')).toBeNull()
  })

  it('keys entries independently by license key', async () => {
    const licenseCache = createLicenseCache({ cache: fakeCache(), now: () => 1 })
    await licenseCache.write('key-a', { valid: true }, 300)
    await licenseCache.write('key-b', { valid: false }, 60)
    expect(await licenseCache.read('key-a')).toMatchObject({ valid: true })
    expect(await licenseCache.read('key-b')).toMatchObject({ valid: false })
  })

  it('treats a legacy entry without an expiry as expired', async () => {
    let t = 1_000
    const cache = fakeCache()
    const licenseCache = createLicenseCache({ cache, now: () => t })
    await licenseCache.write('key-1', { valid: true }, 300)
    const url = `https://license-cache.local/${await sha256('key-1')}`
    const legacy = new Response(JSON.stringify({ valid: true, status: 'active' }), {
      headers: { 'Content-Type': 'application/json' },
    })
    await cache.put(url, legacy)
    expect(await licenseCache.read('key-1')).toBeNull()
  })
})

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}