import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { surfEstimate, type SurfEstimate } from './breaking'
import { rate } from './surf'

export type DaySummary = { date: string; hours: HourPoint[]; maxHs: number; maxSurf: SurfEstimate | null; best: number }

export function summarizeDays(spot: Spot, hours: HourPoint[]): DaySummary[] {
  const map = new Map<string, HourPoint[]>()
  for (const h of hours) {
    const d = h.time.slice(0, 10)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(h)
  }
  return [...map.entries()].map(([date, hs]) => {
    // só horas com luz (5h–19h) contam para a "melhor nota"
    const daylight = hs.filter((h) => {
      const hr = Number(h.time.slice(11, 13))
      return hr >= 5 && hr <= 19
    })
    return {
      date,
      hours: hs,
      maxHs: Math.max(...hs.map((h) => h.waveHeight ?? 0)),
      // maior altura na arrebentação nas horas com luz
      maxSurf: (daylight.length ? daylight : hs)
        .map((h) => surfEstimate(spot, h))
        .reduce<SurfEstimate | null>((m, e) => (e && (!m || e.hb > m.hb) ? e : m), null),
      best: Math.max(0, ...daylight.map((h) => rate(spot, h).score)),
    }
  })
}
