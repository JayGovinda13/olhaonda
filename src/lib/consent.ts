import { useSyncExternalStore } from 'react'

/**
 * Consentimento de cookies (LGPD).
 *  - granted: anúncios personalizados
 *  - denied:  só anúncios não personalizados (sem perfil de interesses)
 *  - null:    ainda não respondeu; nenhum script de anúncio é carregado
 */
export type Consent = 'granted' | 'denied' | null

const KEY = 'olhaonda:consent:v1'

function read(): Consent {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

let value: Consent = read()
const subs = new Set<() => void>()

export const consentStore = {
  get: () => value,
  set(v: Consent) {
    value = v
    try {
      if (v) localStorage.setItem(KEY, v)
      else localStorage.removeItem(KEY)
    } catch {
      /* storage bloqueado: vale só nesta visita */
    }
    subs.forEach((f) => f())
  },
  subscribe(f: () => void) {
    subs.add(f)
    return () => {
      subs.delete(f)
    }
  },
}

export function useConsent() {
  return useSyncExternalStore(consentStore.subscribe, consentStore.get, () => null)
}
