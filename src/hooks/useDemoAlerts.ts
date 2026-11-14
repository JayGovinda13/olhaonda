import { useEffect } from 'react'
import { fetchForecast } from '../api/openMeteo'
import { useAuth } from '../auth/context'
import { backend } from '../backend'
import { ALL_SPOTS } from '../data/spots'
import { localNotify } from '../lib/push'
import { EMPTY_ALERT, evaluateAlert, type AlertState } from '../../supabase/functions/_shared/core/alerts.ts'
import { dailySummary } from '../../supabase/functions/_shared/core/summary.ts'
import { localNow } from '../../supabase/functions/_shared/core/time.ts'

const EVERY = 30 * 60_000

/**
 * Modo demonstração (sem servidor): faz no navegador a rodada que a Edge Function daily-forecast faz no Supabase:
 * resumo do dia no fórum de cada pico favorito e o ciclo de avisos (entrou, mudou, saiu com o motivo, voltou).
 * Roda ao abrir o site e a cada 30 min. Não há WhatsApp aqui: só o sino e a notificação do navegador.
 */
export function useDemoAlerts() {
  const { user } = useAuth()
  const uid = user?.id
  useEffect(() => {
    if (!uid || backend.mode !== 'demo' || !backend.notifications.add || !backend.alerts.saveState) return
    let alive = true
    const run = async () => {
      const key = `olhaonda:demo-alerts:${uid}`
      try {
        const last = Number(localStorage.getItem(key) ?? 0)
        if (Date.now() - last < EVERY) return
        localStorage.setItem(key, String(Date.now()))
      } catch {
        /* sem storage: roda mesmo assim */
      }
      const now = localNow()
      const favs = await backend.favorites.list().catch(() => [])
      const states: Record<string, AlertState> = await backend.alerts.states().catch(() => ({}))
      for (const fav of favs) {
        const spot = ALL_SPOTS.find((s) => s.id === fav.spotId)
        if (!spot || !alive) continue
        const f = await fetchForecast(spot.lat, spot.lon).catch(() => null)
        if (!f || !alive) continue
        const s = dailySummary(spot, f, now.date)
        if (s) await backend.forum.ensureDailyPost?.(spot.id, s)
        if (!fav.notify) continue
        const { state, event } = evaluateAlert(spot, f.hours, fav.prefs, states[spot.id] ?? EMPTY_ALERT, now)
        if (event) {
          const n = await backend.notifications.add!({ spotId: spot.id, kind: event.type, eventSeq: event.seq, sessionDate: event.sessionDate, title: event.title, body: event.body, url: event.url })
          if (n) await localNotify(event.title, event.body, event.url, spot.id)
        }
        await backend.alerts.saveState!(spot.id, state)
      }
    }
    void run()
    const t = setInterval(() => void run(), EVERY)
    const now = () => void run()
    window.addEventListener('olhaonda:alerts', now)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener('olhaonda:alerts', now)
    }
  }, [uid])
}

/** Força a próxima rodada (depois de salvar um favorito, por exemplo). Também zera o ciclo do pico, como o banco faz. */
export function resetDemoAlerts(uid: string) {
  try {
    localStorage.removeItem(`olhaonda:demo-alerts:${uid}`)
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new Event('olhaonda:alerts'))
}
