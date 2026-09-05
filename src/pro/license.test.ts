import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyLicenseKey } from './license'

describe('verifyLicenseKey', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects every key when no license URL is configured', async () => {
    const result = await verifyLicenseKey('SOME-RANDOM-KEY')
    expect(result.valid).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('does not accept the removed demo key', async () => {
    const result = await verifyLicenseKey('PRO-DEMO-2026')
    expect(result.valid).toBe(false)
  })

  it('marks network failures as transient so callers keep the stored key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const result = await verifyLicenseKey('SOME-KEY')
    expect(result.valid).toBe(false)
    expect(result.transient).toBe(true)
  })

  it('marks a 5xx from the worker as transient', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 502 })),
    )
    const result = await verifyLicenseKey('SOME-KEY')
    expect(result.valid).toBe(false)
    expect(result.transient).toBe(true)
  })

  it('does not mark a confirmed-invalid key as transient', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ valid: false, status: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    const result = await verifyLicenseKey('SOME-KEY')
    expect(result.valid).toBe(false)
    expect(result.transient).toBeUndefined()
  })
})
