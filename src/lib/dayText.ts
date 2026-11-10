import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { compass, weatherLabel, WIND_LABEL, windKind, type WindKind } from './surf'

/** Resumos curtos do dia para os cards de Tempo e Vento (manhã 5h–11h, tarde 12h–18h). */

const hourOf = (h: HourPoint) => Number(h.time.slice(11, 13))
const parts = (hours: HourPoint[]) =>
  [
    { label: 'Manhã', hs: hours.filter((h) => hourOf(h) >= 5 && hourOf(h) <= 11) },
    { label: 'Tarde', hs: hours.filter((h) => hourOf(h) >= 12 && hourOf(h) <= 18) },
  ].filter((p) => p.hs.length)

function mode<T>(xs: T[]): T | null {
  const c = new Map<T, number>()
  let best: T | null = null
  let n = 0
  for (const x of xs) {
    const v = (c.get(x) ?? 0) + 1
    c.set(x, v)
    if (v > n) {
      n = v
      best = x
    }
  }
  return best
}

const nums = (xs: (number | null)[]) => xs.filter((v): v is number => v != null)

/** direção média (vetorial), em graus */
export function meanDir(ds: number[]) {
  if (!ds.length) return null
  const x = ds.reduce((s, d) => s + Math.cos((d * Math.PI) / 180), 0)
  const y = ds.reduce((s, d) => s + Math.sin((d * Math.PI) / 180), 0)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** maior sequência de horas seguidas que atendem `ok`: "06h–09h" */
function longestRun(hours: HourPoint[], ok: (h: HourPoint) => boolean) {
  let best: HourPoint[] = []
  let run: HourPoint[] = []
  for (const h of hours) {
    if (ok(h)) run.push(h)
    else run = []
    if (run.length > best.length) best = [...run]
  }
  if (best.length < 2) return null
  const end = String(hourOf(best[best.length - 1]) + 1).padStart(2, '0')
  return `${best[0].time.slice(11, 13)}h–${end}h`
}

export function weatherSummary(hours: HourPoint[]): string[] {
  const out = parts(hours).map((p) => {
    const sky = weatherLabel(mode(p.hs.map((h) => h.weatherCode)))
    const t = nums(p.hs.map((h) => h.airTemp))
    const rain = Math.max(0, ...nums(p.hs.map((h) => h.rainChance)))
    const temp = t.length ? `${Math.round(Math.min(...t))}–${Math.round(Math.max(...t))}°C` : ''
    return `${p.label}: ${sky.toLowerCase()}${temp ? `, ${temp}` : ''}, chuva até ${rain}%.`
  })
  const day = hours.filter((h) => hourOf(h) >= 5 && hourOf(h) <= 18)
  const dry = longestRun(day, (h) => (h.rainChance ?? 0) < 30)
  if (dry) out.push(`Mais seco: ${dry}.`)
  const uv = longestRun(day, (h) => (h.uv ?? 0) >= 6)
  if (uv) out.push(`UV alto ${uv}: use protetor.`)
  return out
}

const GOOD: WindKind[] = ['terral', 'cross-terral', 'calmo']

export function windSummary(spot: Spot, hours: HourPoint[]): string[] {
  const out = parts(hours).map((p) => {
    const speed = nums(p.hs.map((h) => h.windSpeed))
    const avg = speed.length ? speed.reduce((a, b) => a + b, 0) / speed.length : 0
    const dir = meanDir(nums(p.hs.map((h) => h.windDirection)))
    const kind = windKind(spot, dir, avg)
    return `${p.label}: ${WIND_LABEL[kind].toLowerCase()}, ${Math.round(avg)} km/h${dir == null ? '' : ` de ${compass(dir)}`}.`
  })
  const day = hours.filter((h) => hourOf(h) >= 5 && hourOf(h) <= 18)
  const good = longestRun(day, (h) => GOOD.includes(windKind(spot, h.windDirection, h.windSpeed)))
  out.push(good ? `Terral ou sem vento: ${good}.` : 'Sem janela de terral com luz do dia.')
  const gusts = day.filter((h) => h.windGusts != null)
  if (gusts.length) {
    const g = gusts.reduce((a, b) => (b.windGusts! > a.windGusts! ? b : a))
    out.push(`Rajada mais forte: ${Math.round(g.windGusts!)} km/h às ${g.time.slice(11, 13)}h.`)
  }
  return out
}

/** resumo do vento de um dia para a faixa de 14 dias */
export function windDay(spot: Spot, hours: HourPoint[]) {
  const day = hours.filter((h) => hourOf(h) >= 5 && hourOf(h) <= 18)
  const hs = day.length ? day : hours
  const speed = nums(hs.map((h) => h.windSpeed))
  const avg = speed.length ? speed.reduce((a, b) => a + b, 0) / speed.length : null
  const dir = meanDir(nums(hs.map((h) => h.windDirection)))
  const gust = Math.max(0, ...nums(hs.map((h) => h.windGusts)))
  // manhã define a cor: é quando a maioria pega onda
  const morning = hs.filter((h) => hourOf(h) <= 11)
  const kinds = morning.map((h) => windKind(spot, h.windDirection, h.windSpeed))
  const goodMorning = kinds.filter((k) => GOOD.includes(k)).length >= kinds.length / 2
  return { avg, dir, gust, goodMorning }
}

/** horário da hora de maior valor: "15h" */
export function peakHour(hours: HourPoint[], get: (h: HourPoint) => number | null) {
  let best: HourPoint | null = null
  for (const h of hours) if (get(h) != null && (best == null || get(h)! > get(best)!)) best = h
  return best ? `${best.time.slice(11, 13)}h` : '—'
}
