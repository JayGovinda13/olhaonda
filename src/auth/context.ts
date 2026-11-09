import { createContext, useContext } from 'react'
import type { Profile } from '../backend'

export type AuthCtx = {
  user: Profile | null
  ready: boolean
  /** Abre o diálogo de login; resolve true quando o usuário entrar (false se fechar). */
  requireLogin: (reason?: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthCtx | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
