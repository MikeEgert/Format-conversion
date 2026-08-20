import { useCallback, useState, type ReactNode } from 'react'
import { ProContext } from './context'
import { verifyLicenseKey } from './license'

const STORAGE_KEY = 'format-conversion.pro'

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const unlock = useCallback(async (key: string) => {
    const result = await verifyLicenseKey(key)
    if (result.valid) {
      try {
        localStorage.setItem(STORAGE_KEY, '1')
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
