import { createContext } from 'react'
import type { LicenseCheck } from './license'

export interface ProContextValue {
  isPro: boolean
  unlock: (key: string) => Promise<LicenseCheck>
  lock: () => void
}

export const ProContext = createContext<ProContextValue | null>(null)
