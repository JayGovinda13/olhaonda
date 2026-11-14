import { useCallback, useEffect, useState } from 'react'
import { backend, type WhatsAppStatus } from '../backend'
import { useAuth } from '../auth/context'

const NONE: WhatsAppStatus = { phone: null, enabled: false, optedOut: false }

/** WhatsApp ligado à conta (número verificado) e as ações de ligar, verificar, pausar e desligar. */
export function useWhatsApp() {
  const { user } = useAuth()
  const uid = user?.id ?? null
  const [data, setData] = useState<{ uid: string; s: WhatsAppStatus } | null>(null)

  const refresh = useCallback(async () => {
    if (!uid) return
    try {
      setData({ uid, s: await backend.whatsapp.status() })
    } catch {
      /* sem rede: mantém */
    }
  }, [uid])
  useEffect(() => {
    if (!uid) return
    let alive = true
    backend.whatsapp
      .status()
      .then((st) => alive && setData({ uid, s: st }))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [uid])

  const status = data && data.uid === uid ? data.s : null
  return {
    status: status ?? NONE,
    loaded: status != null,
    start: backend.whatsapp.start,
    verify: async (code: string) => {
      const r = await backend.whatsapp.verify(code)
      await refresh()
      return r
    },
    setEnabled: async (on: boolean) => {
      await backend.whatsapp.setEnabled(on)
      await refresh()
    },
    unlink: async () => {
      await backend.whatsapp.unlink()
      await refresh()
    },
  }
}

/** +5511999991234 → +55 11 9****-1234 (não mostra o número inteiro na tela) */
export function maskPhone(p: string | null) {
  if (!p) return ''
  const d = p.replace(/\D/g, '')
  if (d.length < 12) return p
  return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.length === 13 ? '9' : ''}****-${d.slice(-4)}`
}
