import { createContext } from 'react'

export interface ProContextValue {
  isPro: boolean
  unlock: (key: string) => Promise<boolean>
  lock: () => void
}

export const ProContext = createContext<ProContextValue | null>(null)
