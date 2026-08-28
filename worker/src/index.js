import { createRateLimiter } from './rateLimit.js'

const LS_ENDPOINT = 'https://api.lemonsqueezy.com/v1/licenses/validate'

const ALLOWED_ORIGINS = [
  'https://format-conversion.maidemikkegert.workers.dev',
  'http://localhost:5173',
  'http://localhost:4173',
]

const MAX_KEY_LENGTH = 200
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
const CACHE_TTL_VALID_SECONDS = 300
const CACHE_TTL_INVALID_SECONDS = 60

const rateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
})

function corsHeaders(request) {
  const origin = request.headers.get('Origin')
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    }
  }
  return {}
}

function rateLimited(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  return rateLimiter.isLimited(ip)
}

function respond(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

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

async function readCached(cacheUrl) {
  try {
    const cached = await caches.default.match(cacheUrl)
    if (cached) return await cached.json()
  } catch {
    // fall through on cache failure
  }
  return null
}

async function writeCached(cacheUrl, body, ttlSeconds) {
  try {
    const response = new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${ttlSeconds}`,
      },
    })
    await caches.default.put(cacheUrl, response)
  } catch {
    // caching is best-effort
  }
}

export default {
  async fetch(request) {
    const headers = corsHeaders(request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    const url = new URL(request.url)

    if (request.method !== 'POST' || url.pathname !== '/validate') {
      return respond({ valid: false, error: 'Not found' }, 404, headers)
    }

    if (rateLimited(request)) {
      return respond({ valid: false, error: 'Too many requests' }, 429, headers)
    }

    let licenseKey
    try {
      const body = await request.json()
      licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : ''
    } catch {
      return respond({ valid: false, error: 'Invalid request body' }, 400, headers)
    }

    if (!licenseKey) {
      return respond({ valid: false, error: 'License key is required' }, 422, headers)
    }

    if (licenseKey.length > MAX_KEY_LENGTH) {
      return respond({ valid: false, error: 'License key is too long' }, 422, headers)
    }

    const cacheUrl = await cacheUrlFor(licenseKey)
    const cached = await readCached(cacheUrl)
    if (cached) {
      return respond(cached, 200, headers)
    }

    const upstream = await fetch(LS_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ license_key: licenseKey }).toString(),
    })

    if (!upstream.ok) {
      if (upstream.status >= 500) {
        return respond({ valid: false, error: 'Could not reach license service' }, 502, headers)
      }
      let data
      try {
        data = await upstream.json()
      } catch {
        data = {}
      }
      return respond(
        {
          valid: false,
          status: data.license_key?.status ?? null,
          error: data.error ?? 'License key is invalid',
        },
        200,
        headers,
      )
    }

    const data = await upstream.json()
    const body = {
      valid: data.valid === true,
      status: data.license_key?.status ?? null,
    }
    await writeCached(
      cacheUrl,
      body,
      body.valid ? CACHE_TTL_VALID_SECONDS : CACHE_TTL_INVALID_SECONDS,
    )
    return respond(body, 200, headers)
  },
}
