import { useEffect, useState } from 'react'
import { fetchForecast } from '../api/openMeteo'
import { backend } from '../backend'
import { FEATURES } from '../config/env'
import type { Spot } from '../data/spots'
import { dailySummary } from '../../supabase/functions/_shared/core/summary.ts'
import { localNow } from '../../supabase/functions/_shared/core/time.ts'

/**
 * Modo demonstração: garante o resumo de hoje no fórum do pico (no Supabase quem publica é a
 * Edge Function daily-forecast, às 5h). Devolve um contador que muda quando o post é criado.
 */
export function useDailyPost(spot: Spot | null) {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!spot || !FEATURES.forum || !backend.forum.ensureDailyPost) return
    let alive = true
    const today = localNow().date
    fetchForecast(spot.lat, spot.lon)
      .then(async (f) => {
        const s = dailySummary(spot, f, today)
        if (!s || !alive) return
        await backend.forum.ensureDailyPost!(spot.id, s)
        if (alive) setVersion((v) => v + 1)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [spot])
  return version
}
