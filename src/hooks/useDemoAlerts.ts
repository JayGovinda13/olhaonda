import { useEffect } from 'react'
import { fetchForecast } from '../api/openMeteo'
import { useAuth } from '../auth/context'
import { backend } from '../backend'
import { ALL_SPOTS } from '../data/spots'
import { localNotify } from '../lib/push'
import { describeMatch, findMatches } from '../../supabase/functions/_shared/core/prefs.ts'
import { dailySummary } from '../../supabase/functions/_shared/core/summary.ts'
import { localNow } from '../../supabase/functions/_shared/core/time.ts'

const EVERY = 30 * 60_000

/**
 * Modo demonstração (sem servidor): faz no navegador a rodada que a Edge Function daily-forecast
 * faz no Supabase: resumo do dia no fórum de cada pico favorito e alertas quando a previsão bate
 * com as condições preferidas. Roda ao abrir o site e a cada 30 min.
 */
export function useDemoAlerts() {
  const { user } = useAuth()
  const uid = user?.id
  useEffect(() => {
    if (!uid || backend.mode !== 'demo' || !backend.notifications.add) return
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
      for (const fav of favs) {
        const spot = ALL_SPOTS.find((s) => s.id === fav.spotId)
        if (!spot || !alive) continue
        const f = await fetchForecast(spot.lat, spot.lon).catch(() => null)
        if (!f || !alive) continue
        const s = dailySummary(spot, f, now.date)
        if (s) await backend.forum.ensureDailyPost?.(spot.id, s)
        if (!fav.notify) continue
        for (const m of findMatches(spot, f.hours, fav.prefs, now.hour)) {
          const url = `/pico/${spot.id}?t=${encodeURIComponent(m.start)}`
          const title = `${spot.name}: condição do seu gosto`
          const body = describeMatch(m)
          const n = await backend.notifications.add!({ spotId: spot.id, sessionDate: m.date, title, body, url })
          if (n) await localNotify(title, body, url, `${spot.id}:${m.date}`)
        }
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

/** Força a próxima rodada (depois de salvar um favorito, por exemplo). */
export function resetDemoAlerts(uid: string) {
  try {
    localStorage.removeItem(`olhaonda:demo-alerts:${uid}`)
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new Event('olhaonda:alerts'))
}
