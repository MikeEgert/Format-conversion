const DEMO_KEY = 'PRO-DEMO-2026'

export async function verifyLicenseKey(key: string): Promise<boolean> {
  const normalized = key.trim().toUpperCase()

  if (normalized === DEMO_KEY) return true

  // TODO: Replace with real license validation against your payment provider
  // (Lemon Squeezy, Stripe, Paddle) or your own backend. Return the
  // entitlement result here (valid + plan) instead of a boolean.
  return false
}
