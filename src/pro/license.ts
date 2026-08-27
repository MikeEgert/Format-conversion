export interface LicenseCheck {
  valid: boolean
  reason?: string
}

function reasonForStatus(status: string | null): string | undefined {
  switch (status) {
    case 'expired':
      return 'This license key has expired.'
    case 'disabled':
      return 'This license key has been disabled.'
    default:
      return undefined
  }
}

export async function verifyLicenseKey(key: string): Promise<LicenseCheck> {
  const licenseKey = key.trim()
  const serviceUrl =
    import.meta.env.VITE_LICENSE_URL || 'https://format-conversion-license.maidemikkegert.workers.dev'

  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, '')}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey }),
    })

    if (!res.ok) {
      return {
        valid: false,
        reason: 'Could not verify the license key right now. Please try again.',
      }
    }

    const data = (await res.json()) as { valid: boolean; status: string | null }
    if (data.valid) return { valid: true }

    return {
      valid: false,
      reason: reasonForStatus(data.status) ?? "That key isn't valid. Try again.",
    }
  } catch {
    return {
      valid: false,
      reason: 'Could not verify the license key right now. Please try again.',
    }
  }
}
