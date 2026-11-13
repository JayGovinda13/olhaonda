import type { HourPoint } from './openMeteo.ts'
import type { Spot } from './spots.ts'

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']

/** Graus -> rosa dos ventos em português (L = leste, O = oeste). */
export function compass(deg: number | null | undefined) {
  if (deg == null) return '—'
  return COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

/** Direção em graus + rosa dos ventos: "172° S". */
export function dirDeg(deg: number | null | undefined) {
  if (deg == null) return '—'
  const d = Math.round(((deg % 360) + 360) % 360)
  return `${d}° ${compass(d)}`
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

/** Limite (km/h) entre vento fraco e forte. 20 km/h ≈ 11 nós. */
export const STRONG_WIND_KMH = 20

/** "Vento fraco" / "Vento forte", sem julgar a qualidade das ondas. */
export function windStrength(speed: number | null | undefined) {
  if (speed == null) return '—'
  return speed < STRONG_WIND_KMH ? 'Vento fraco' : 'Vento forte'
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
  const shelter = spot.sheltered ? 0.45 : 1
  const effective = shelter * Math.max(swellH * (0.35 + 0.65 * exposure), (h.windWaveHeight ?? 0) * 0.5)

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

const RHO_G = 1025 * 9.81 // água do mar (kg/m³) × gravidade (m/s²)

/**
 * Período de energia (Te), o período que de fato carrega a energia do trem de ondas.
 * A Open-Meteo não entrega o período de pico (vem vazio em todos os modelos testados), só o período
 * médio (Tm01), que é mais curto: num espectro de swell Te ≈ 1,1 · Tm01 e Te ≈ 0,9 · Tp.
 * Usar o médio direto subestimava a energia em cerca de 20 %.
 */
export function energyPeriod(mean: number | null | undefined, peak?: number | null) {
  if (peak != null && peak > 0) return 0.9 * peak
  if (mean != null && mean > 0) return 1.1 * mean
  return null
}

/**
 * Energia de um trem de ondas, em quilojoules (kJ) por metro de crista:
 * E = ρ·g·H²·L / 8, com L = g·Te² / 2π (comprimento de onda em águas profundas).
 * É a energia de uma onda típica das séries (altura = altura significativa do trem).
 * Equivale a E[kJ] ≈ 1,96 · H² · Te².
 * `te` é o período de energia (use energyPeriod para converter o período do modelo).
 */
export function trainEnergy(h: number, te: number) {
  const L = (9.81 * te * te) / (2 * Math.PI)
  return (RHO_G * h * h * L) / 8 / 1000 // J -> kJ
}

/** Energia (kJ) de um trem a partir do período que o modelo entrega (médio, ou o de pico se houver). */
export function trainEnergyFromPeriod(h: number, period: number) {
  return trainEnergy(h, energyPeriod(period) ?? period)
}

/**
 * Força da onda: energia de uma onda por metro de crista, em quilojoules (kJ).
 * Soma a energia de cada trem de ondas com o período dele (swell principal, swell secundário e mar
 * de vento), porque a altura total misturada com o período de um deles erra: o mar de vento é curto
 * e leva pouca energia, o swell é longo e leva muita. Sem as componentes, usa a altura total.
 */
export function waveEnergy(h: HourPoint) {
  const parts: [number | null, number | null][] = [
    [h.swellHeight, energyPeriod(h.swellPeriod, h.swellPeakPeriod)],
    [h.swell2Height, energyPeriod(h.swell2Period)],
    [h.windWaveHeight, energyPeriod(h.windWavePeriod)],
  ]
  let total = 0
  let any = false
  for (const [hh, te] of parts) {
    if (hh != null && te != null && hh > 0) {
      total += trainEnergy(hh, te)
      any = true
    }
  }
  if (any) return total
  const te = energyPeriod(h.wavePeriod, h.swellPeakPeriod)
  if (h.waveHeight == null || te == null) return null
  return trainEnergy(h.waveHeight, te)
}

/** Faixas de força, em kJ por metro de crista. */
export const ENERGY_LEVELS = [
  { max: 100, label: 'Fraca' },
  { max: 400, label: 'Moderada' },
  { max: 1000, label: 'Forte' },
  { max: 2500, label: 'Muito forte' },
  { max: Infinity, label: 'Pesada' },
] as const

export function energyLabel(kj: number | null) {
  if (kj == null) return '—'
  return ENERGY_LEVELS.find((l) => kj < l.max)!.label
}

/** 0–1 para barras (escala log, satura em ~5000 kJ). */
export function energyRatio(kj: number | null) {
  if (kj == null || kj <= 0) return 0
  return Math.min(1, Math.log10(1 + kj) / Math.log10(5001))
}

/** Só o número, em kJ, sem unidade: "342". */
export function fmtKJ(kj: number | null) {
  if (kj == null) return '—'
  return String(Math.round(kj))
}

/** "123 kJ", ou "1,2 MJ" acima de 10 000 kJ. */
export function fmtEnergy(kj: number | null) {
  if (kj == null) return '—'
  if (kj >= 10000) return `${(kj / 1000).toFixed(1).replace('.', ',')} MJ`
  return `${Math.round(kj).toLocaleString('pt-BR')} kJ`
}

/** Códigos WMO usados pela Open-Meteo -> descrição curta. */
export function weatherLabel(code: number | null | undefined) {
  if (code == null) return '—'
  if (code === 0) return 'Céu limpo'
  if (code <= 2) return 'Parcialmente nublado'
  if (code === 3) return 'Nublado'
  if (code <= 48) return 'Neblina'
  if (code <= 57) return 'Garoa'
  if (code <= 67) return 'Chuva'
  if (code <= 77) return 'Neve'
  if (code <= 82) return 'Pancadas de chuva'
  if (code <= 86) return 'Neve'
  return 'Trovoadas'
}

/** Escala de cor da força (energia em kJ): verde claro (fraca) até roxo (pesada). */
const ENERGY_STOPS: [number, [number, number, number]][] = [
  [0, [143, 211, 182]], // #8FD3B6
  [100, [47, 174, 123]], // #2FAE7B
  [400, [15, 76, 58]], // #0F4C3A
  [1000, [122, 46, 110]], // #7A2E6E
  [2500, [75, 29, 90]], // #4B1D5A
]

export function energyColor(kj: number | null) {
  const v = Math.max(0, kj ?? 0)
  for (let i = 1; i < ENERGY_STOPS.length; i++) {
    const [x1, c1] = ENERGY_STOPS[i]
    const [x0, c0] = ENERGY_STOPS[i - 1]
    if (v <= x1) {
      const t = (v - x0) / (x1 - x0)
      const c = c0.map((a, j) => Math.round(a + (c1[j] - a) * t))
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
    }
  }
  const last = ENERGY_STOPS[ENERGY_STOPS.length - 1][1]
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`
}

/** Gradiente CSS da escala de força (legendas). */
// posições na mesma escala log de energyRatio (100 kJ ≈ 54%, 400 ≈ 70%, 1000 ≈ 81%, 2500 ≈ 92%)
export const ENERGY_GRADIENT = 'linear-gradient(90deg, #8FD3B6 0%, #2FAE7B 54%, #0F4C3A 70%, #7A2E6E 81%, #4B1D5A 92%)'
