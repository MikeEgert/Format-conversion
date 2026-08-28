import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ProContext } from './context'
import { verifyLicenseKey } from './license'

const STORAGE_KEY = 'format-conversion.pro'

function readStoredKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState<boolean>(() => readStoredKey() !== null)

  useEffect(() => {
    const stored = readStoredKey()
    if (!stored) return

    let cancelled = false
    verifyLicenseKey(stored).then((result) => {
      if (cancelled) return
      if (!result.valid) {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore storage failures
        }
        setIsPro(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const unlock = useCallback(async (key: string) => {
    const result = await verifyLicenseKey(key)
    if (result.valid) {
      try {
        localStorage.setItem(STORAGE_KEY, key.trim())
      } catch {
        // ignore storage failures; session still works
      }
      setIsPro(true)
    }
    return result
  }, [])

  const lock = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage failures
    }
    setIsPro(false)
  }, [])

  return <ProContext.Provider value={{ isPro, unlock, lock }}>{children}</ProContext.Provider>
}
