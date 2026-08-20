import { useContext } from 'react'
import { ProContext, type ProContextValue } from './context'

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext)
  if (!ctx) throw new Error('usePro must be used within a ProProvider')
  return ctx
}
