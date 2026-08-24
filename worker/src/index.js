const LS_ENDPOINT = 'https://api.lemonsqueezy.com/v1/licenses/validate'

const ALLOWED_ORIGINS = [
  'https://format-conversion.maidemikkegert.workers.dev',
  'http://localhost:5173',
  'http://localhost:4173',
]

const MAX_KEY_LENGTH = 200
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30

const buckets = new Map()

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
  const now = Date.now()
  let entry = buckets.get(ip)
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry = { start: now, count: 0 }
    buckets.set(ip, entry)
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

function respond(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
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

    const upstream = await fetch(LS_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ license_key: licenseKey }).toString(),
    })

    if (!upstream.ok) {
      return respond({ valid: false, error: 'Could not reach license service' }, 502, headers)
    }

    const data = await upstream.json()
    return respond(
      {
        valid: data.valid === true,
        status: data.license_key?.status ?? null,
      },
      200,
      headers,
    )
  },
}
