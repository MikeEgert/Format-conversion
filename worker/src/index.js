const LS_ENDPOINT = 'https://api.lemonsqueezy.com/v1/licenses/validate'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function respond(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (request.method !== 'POST' || url.pathname !== '/validate') {
      return respond({ valid: false, error: 'Not found' }, 404)
    }

    let licenseKey
    try {
      const body = await request.json()
      licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : ''
    } catch {
      return respond({ valid: false, error: 'Invalid request body' }, 400)
    }

    if (!licenseKey) {
      return respond({ valid: false, error: 'License key is required' }, 422)
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
      return respond({ valid: false, error: 'Could not reach license service' }, 502)
    }

    const data = await upstream.json()
    return respond({
      valid: data.valid === true,
      status: data.license_key?.status ?? null,
    })
  },
}
