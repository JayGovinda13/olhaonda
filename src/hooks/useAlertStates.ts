import { useEffect, useState } from 'react'
import { backend, type AlertState } from '../backend'
import { useAuth } from '../auth/context'
import { ALERTS_EVENT } from '../lib/alertsBus'

/** Ciclo de aviso de cada pico favorito (ativo, parado, janelas já avisadas), para mostrar em "Meus picos". */
export function useAlertStates(reload?: unknown) {
  const { user } = useAuth()
  const uid = user?.id ?? null
  const [data, setData] = useState<{ uid: string; map: Record<string, AlertState> } | null>(null)
  useEffect(() => {
    if (!uid) return
    let alive = true
    const load = () =>
      backend.alerts
        .states()
        .then((map) => alive && setData({ uid, map }))
        .catch(() => {})
    void load()
    const t = setInterval(() => void load(), 2 * 60_000)
    const off = backend.notifications.onChange(() => void load())
    window.addEventListener(ALERTS_EVENT, load)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener(ALERTS_EVENT, load)
      off()
    }
  }, [uid, reload])
  return data && data.uid === uid ? data.map : {}
}
