/**
 * Resumo diário da previsão de um pico, publicado pelo OlhaOnda no fórum do pico.
 * Mesmo cálculo da página de previsão (altura na arrebentação, vento terral/maral, maré, lua).
 * Texto factual: tamanho, vento e maré, sem juízo de valor sobre as ondas.
 */
import { surfEstimate } from './breaking.ts'
import { moonInfo } from './moon.ts'
import type { Forecast, HourPoint } from './openMeteo.ts'
import type { Spot } from './spots.ts'
import { compass, dayLabel, dirDeg, fmtEnergy, waveEnergy, weatherLabel, WIND_LABEL, windKind, type WindKind } from './surf.ts'
import { extremes, m1, tidePortFor } from './tidePorts.ts'

const f1 = (v: number) => v.toFixed(1).replace('.', ',')
const hourOf = (iso: string) => Number(iso.slice(11, 13))

function mode<T>(xs: T[]): T | null {
  const c = new Map<T, number>()
  xs.forEach((x) => c.set(x, (c.get(x) ?? 0) + 1))
  let best: T | null = null
  let n = 0
  c.forEach((v, k) => {
    if (v > n) {
      n = v
      best = k
    }
  })
  return best
}

/** média de direções (vetorial) */
function meanDir(ds: number[]) {
  if (!ds.length) return null
  const x = ds.reduce((s, d) => s + Math.cos((d * Math.PI) / 180), 0)
  const y = ds.reduce((s, d) => s + Math.sin((d * Math.PI) / 180), 0)
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
}

type Part = { label: string; lo: number; hi: number; wind: WindKind | null; windKmh: number; windDir: number | null }

function part(spot: Spot, hs: HourPoint[], label: string): Part | null {
  const est = hs.map((h) => surfEstimate(spot, h)).filter((e) => e != null)
  if (!est.length) return null
  const kinds = hs.map((h) => windKind(spot, h.windDirection, h.windSpeed))
  const speeds = hs.map((h) => h.windSpeed ?? 0)
  return {
    label,
    lo: Math.min(...est.map((e) => e!.lo)),
    hi: Math.max(...est.map((e) => e!.hi)),
    wind: mode(kinds),
    windKmh: speeds.reduce((a, b) => a + b, 0) / speeds.length,
    windDir: meanDir(hs.map((h) => h.windDirection).filter((d): d is number => d != null)),
  }
}

export type DailySummary = { date: string; title: string; body: string }

export function dailySummary(spot: Spot, forecast: Forecast, date: string): DailySummary | null {
  const day = forecast.hours.filter((h) => h.time.startsWith(date))
  if (!day.length) return null
  const morning = part(spot, day.filter((h) => hourOf(h.time) >= 5 && hourOf(h.time) <= 11), 'Manhã')
  const afternoon = part(spot, day.filter((h) => hourOf(h.time) >= 12 && hourOf(h.time) <= 18), 'Tarde')
  const parts = [morning, afternoon].filter((p): p is Part => p != null)
  if (!parts.length) return null
  const { wd, dm } = dayLabel(date)

  // swell dominante às 9h (ou a primeira hora com luz)
  const ref = day.find((h) => hourOf(h.time) === 9) ?? day[0]
  const energy = waveEnergy(ref)
  const swellLine =
    ref.swellHeight != null
      ? `Swell: ${f1(ref.swellHeight)} m · ${Math.round(ref.swellPeakPeriod ?? ref.swellPeriod ?? 0)} s de ${dirDeg(ref.swellDirection)}` +
        (energy != null ? ` · força ${fmtEnergy(energy)}` : '') +
        (ref.swell2Height != null && ref.swell2Height >= 0.3
          ? `\nSwell 2: ${f1(ref.swell2Height)} m · ${Math.round(ref.swell2Period ?? 0)} s de ${dirDeg(ref.swell2Direction)}`
          : '')
      : null

  const port = tidePortFor(spot)
  const tideHours = day.map((h) => ({ ...h, seaLevel: h.seaLevel == null ? null : h.seaLevel + port.z0 }))
  const ext = extremes(tideHours)
  const moon = moonInfo(new Date(`${date}T12:00:00-03:00`))
  const sun = forecast.sun.find((s) => s.date === date)

  const lines: string[] = []
  lines.push(`Ondas na arrebentação (onda comum – séries):`)
  parts.forEach((p) => lines.push(`• ${p.label}: ${f1(p.lo)}–${f1(p.hi)} m`))
  if (swellLine) lines.push(swellLine)
  lines.push('')
  lines.push('Vento:')
  parts.forEach((p) =>
    lines.push(`• ${p.label}: ${p.wind ? WIND_LABEL[p.wind].toLowerCase() : '—'}, ${Math.round(p.windKmh)} km/h de ${dirDeg(p.windDir)}`),
  )
  lines.push('')
  if (ext.length) lines.push(`Maré, ${port.name}: ${ext.map((e) => `${e.kind} ${e.time.slice(11, 16)} ${m1(e.level)}`).join(' · ')}`)
  lines.push(`Lua ${moon.name.toLowerCase()} (${Math.round(moon.illumination * 100)}%)${moon.tideKind ? ` · maré de ${moon.tideKind}` : ''}`)
  if (sun)
    lines.push(
      `Tempo: ${weatherLabel(sun.weatherCode).toLowerCase()}, ${sun.tMin == null ? '—' : Math.round(sun.tMin)}–${sun.tMax == null ? '—' : Math.round(sun.tMax)}°C, chuva ${sun.rainChance ?? 0}% · sol ${sun.sunrise.slice(11, 16)}–${sun.sunset.slice(11, 16)}`,
    )
  if (ref.waterTemp != null) lines.push(`Água: ${Math.round(ref.waterTemp)}°C`)
  if (day.every((h) => h.longRange)) lines.push('\nPrevisão de longo prazo (tendência): pode mudar bastante.')
  lines.push('\nComo está aí? Conte nas respostas como o mar realmente está: isso ajuda a calibrar a previsão.')

  const top = parts.reduce((a, b) => (b.hi > a.hi ? b : a))
  const windShort = morning?.wind ? `${WIND_LABEL[morning.wind].toLowerCase()} de manhã` : ''
  const title = `Previsão ${wd} ${dm}: ${f1(Math.min(...parts.map((p) => p.lo)))}–${f1(top.hi)} m${windShort ? `, ${windShort}` : ''}${
    ref.swellDirection != null ? `, swell ${compass(ref.swellDirection)}` : ''
  }`
  return { date, title: title.slice(0, 140), body: lines.join('\n') }
}
