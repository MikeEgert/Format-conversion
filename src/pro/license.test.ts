import { describe, expect, it } from 'vitest'
import { verifyLicenseKey } from './license'

describe('verifyLicenseKey', () => {
  it('rejects every key when no license URL is configured', async () => {
    const result = await verifyLicenseKey('SOME-RANDOM-KEY')
    expect(result.valid).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('does not accept the removed demo key', async () => {
    const result = await verifyLicenseKey('PRO-DEMO-2026')
    expect(result.valid).toBe(false)
  })
})
