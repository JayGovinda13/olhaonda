import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']

/** Graus -> rosa dos ventos em português (L = leste, O = oeste). */
export function compass(deg: number | null | undefined) {
  if (deg == null) return '—'
  return COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

/** Menor diferença angular entre dois rumos (0–180). */
export function angleDiff(a: number, b: number) {
  const d = Math.abs((((a - b) % 360) + 540) % 360 - 180)
  return d
}

export type WindKind = 'terral' | 'cross-terral' | 'lateral' | 'cross-maral' | 'maral' | 'calmo'

export const WIND_LABEL: Record<WindKind, string> = {
  terral: 'Terral',
  'cross-terral': 'Terral lateral',
  lateral: 'Lateral',
  'cross-maral': 'Maral lateral',
  maral: 'Maral',
  calmo: 'Sem vento',
}

/**
 * Classifica o vento em relação à praia.
 * windDir é de onde o vento vem; terral sopra da terra para o mar.
 */
export function windKind(spot: Spot, windDir: number | null, windSpeed: number | null): WindKind {
  if (windDir == null || windSpeed == null) return 'calmo'
  if (windSpeed < 6) return 'calmo'
  const fromSea = angleDiff(windDir, spot.facing) // 0 = vento vindo do mar (maral)
  if (fromSea >= 150) return 'terral'
  if (fromSea >= 110) return 'cross-terral'
  if (fromSea >= 70) return 'lateral'
  if (fromSea >= 30) return 'cross-maral'
  return 'maral'
}

export type Rating = { score: number; label: string }

const LABELS = ['Flat', 'Fraco', 'Regular', 'Bom', 'Muito bom', 'Clássico']

/**
 * Nota de 0 a 5 para a sessão naquele horário.
 * Heurística simples e transparente: tamanho × exposição ao swell × período, menos penalidade de vento.
 */
export function rate(spot: Spot, h: HourPoint): Rating {
  const swellH = h.swellHeight ?? 0
  const swellDir = h.swellDirection ?? h.waveDirection
  const period = h.swellPeakPeriod ?? h.swellPeriod ?? h.wavePeriod ?? 0
  const total = h.waveHeight ?? swellH

  // Exposição: swell chegando de frente vale 1, a 90° ou mais quase nada.
  const exposure = swellDir == null ? 0.6 : Math.max(0, Math.cos((angleDiff(swellDir, spot.facing) * Math.PI) / 180))
  const effective = Math.max(swellH * (0.35 + 0.65 * exposure), (h.windWaveHeight ?? 0) * 0.5)

  // Tamanho útil (m) -> pontos (curva suave, satura ~2,5 m e cai no "mar grosso" de beach break)
  let size = 0
  if (effective >= 0.3) size = Math.min(3.2, (effective - 0.3) * 2.2)
  if (spot.kind === 'beach' && total > 3) size -= (total - 3) * 0.8

  // Período: < 7 s é mexido, 10–15 s é linha boa.
  const per = period < 6 ? -0.8 : period < 8 ? -0.3 : period < 10 ? 0.3 : period < 16 ? 0.8 : 0.5

  // Vento
  const kind = windKind(spot, h.windDirection, h.windSpeed)
  const ws = h.windSpeed ?? 0
  const windPenalty: Record<WindKind, number> = {
    calmo: -0.3, // bônus: espelho
    terral: ws > 35 ? 0.6 : -0.4,
    'cross-terral': ws > 30 ? 0.6 : -0.1,
    lateral: ws / 22,
    'cross-maral': ws / 14,
    maral: ws / 10,
  }

  let score = size > 0 ? size + per + 1 - windPenalty[kind] : 0
  score = Math.max(0, Math.min(5, score))
  if (effective < 0.3) score = 0
  return { score, label: LABELS[Math.round(score)] }
}

export function ratingColor(score: number) {
  if (score < 1) return '#C9B8C7'
  if (score < 2) return '#B07AA4'
  if (score < 3) return '#7A2E6E'
  if (score < 4) return '#2FAE7B'
  return '#0F4C3A'
}

export const fmt = {
  m: (v: number | null | undefined, d = 1) => (v == null ? '—' : `${v.toFixed(d).replace('.', ',')} m`),
  s: (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)} s`),
  kmh: (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)} km/h`),
  c: (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)}°C`),
  hour: (iso: string) => iso.slice(11, 16),
}

const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' })
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

/** "2026-11-09" -> { wd: "seg", dm: "09/11" } (datas já estão no fuso local da API). */
export function dayLabel(date: string) {
  const d = new Date(`${date}T12:00:00Z`)
  return { wd: weekday.format(d).replace('.', ''), dm: dayMonth.format(d) }
}

/** Faixa "surfável" estimada a partir da altura significativa. */
export function faceRange(hs: number | null | undefined) {
  if (hs == null) return '—'
  const lo = Math.max(0, hs * 0.8)
  const hi = hs * 1.3
  const f = (v: number) => v.toFixed(1).replace('.', ',')
  return `${f(lo)}–${f(hi)} m`
}

/** Índice da hora atual (no fuso de São Paulo) dentro da série. */
export function currentHourIndex(hours: HourPoint[]) {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(now) // "2026-11-09 14"
  const key = `${parts.slice(0, 10)}T${parts.slice(11, 13)}:00`
  const idx = hours.findIndex((h) => h.time === key)
  return idx >= 0 ? idx : 0
}
