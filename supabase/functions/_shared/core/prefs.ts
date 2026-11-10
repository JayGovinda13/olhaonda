/**
 * Condições favoritas de um pico e a busca das horas da previsão que batem com elas.
 * Usado pela tela "Meus picos" (prévia), pelos alertas do modo demonstração e pela Edge Function diária.
 */
import { surfEstimate } from './breaking.ts'
import type { HourPoint } from './openMeteo.ts'
import type { Spot } from './spots.ts'
import { dayLabel, dirDeg, windKind, type WindKind } from './surf.ts'

export type TideState = 'baixa' | 'enchendo' | 'alta' | 'secando'
export type DayPart = 'manha' | 'tarde'

export type SpotPrefs = {
  /** altura na arrebentação (séries), em metros */
  minWave: number
  maxWave: number
  /** terral = só terral ou sem vento; leve = aceita lateral; qualquer = qualquer direção */
  wind: 'terral' | 'leve' | 'qualquer'
  /** vento máximo (km/h) */
  maxWind: number
  /** período mínimo do swell (s) */
  minPeriod: number
  /** estados de maré aceitos (vazio = qualquer) */
  tide: TideState[]
  /** partes do dia (vazio = qualquer hora com luz) */
  dayParts: DayPart[]
  /** horas seguidas mínimas para valer a sessão */
  minHours: number
  /** quantos dias à frente avisar */
  daysAhead: number
}

export const DEFAULT_PREFS: SpotPrefs = {
  minWave: 0.6,
  maxWave: 2,
  wind: 'leve',
  maxWind: 20,
  minPeriod: 7,
  tide: [],
  dayParts: ['manha', 'tarde'],
  minHours: 2,
  daysAhead: 3,
}

export const TIDE_LABEL: Record<TideState, string> = { baixa: 'Baixa', enchendo: 'Enchendo', alta: 'Alta', secando: 'Secando' }
export const DAYPART_LABEL: Record<DayPart, string> = { manha: 'Manhã (5h–11h)', tarde: 'Tarde (12h–18h)' }
export const WIND_PREF_LABEL: Record<SpotPrefs['wind'], string> = {
  terral: 'Só terral ou sem vento',
  leve: 'Terral, sem vento ou lateral',
  qualquer: 'Qualquer direção',
}

const OK_WIND: Record<SpotPrefs['wind'], WindKind[]> = {
  terral: ['terral', 'cross-terral', 'calmo'],
  leve: ['terral', 'cross-terral', 'calmo', 'lateral'],
  qualquer: ['terral', 'cross-terral', 'calmo', 'lateral', 'cross-maral', 'maral'],
}

/** completa preferências salvas antigas/incompletas com o padrão */
export function normalizePrefs(p: Partial<SpotPrefs> | null | undefined): SpotPrefs {
  return { ...DEFAULT_PREFS, ...(p ?? {}) }
}

const hourOf = (iso: string) => Number(iso.slice(11, 13))
const partOf = (iso: string): DayPart | null => {
  const h = hourOf(iso)
  if (h >= 5 && h <= 11) return 'manha'
  if (h >= 12 && h <= 18) return 'tarde'
  return null
}

/** estado da maré em cada hora: alta/baixa no terço de cima/de baixo da amplitude do dia, senão enchendo/secando */
export function tideStates(hours: HourPoint[]): (TideState | null)[] {
  const byDay = new Map<string, number[]>()
  hours.forEach((h) => {
    if (h.seaLevel == null) return
    const d = h.time.slice(0, 10)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(h.seaLevel)
  })
  return hours.map((h, i) => {
    if (h.seaLevel == null) return null
    const day = byDay.get(h.time.slice(0, 10))!
    const lo = Math.min(...day)
    const hi = Math.max(...day)
    const r = hi - lo || 1
    const f = (h.seaLevel - lo) / r
    if (f >= 0.7) return 'alta'
    if (f <= 0.3) return 'baixa'
    const prev = hours[i - 1]?.seaLevel ?? h.seaLevel
    const next = hours[i + 1]?.seaLevel ?? h.seaLevel
    return next - prev >= 0 ? 'enchendo' : 'secando'
  })
}

export type HourCheck = { ok: boolean; hb: number; windKind: WindKind; tide: TideState | null }

/** confere uma hora contra as preferências */
export function checkHour(spot: Spot, h: HourPoint, prefs: SpotPrefs, tide: TideState | null): HourCheck {
  const hb = surfEstimate(spot, h)?.hb ?? 0
  const wk = windKind(spot, h.windDirection, h.windSpeed)
  const part = partOf(h.time)
  const period = h.swellPeakPeriod ?? h.swellPeriod ?? h.wavePeriod ?? 0
  const ok =
    part != null &&
    (prefs.dayParts.length === 0 || prefs.dayParts.includes(part)) &&
    hb >= prefs.minWave &&
    hb <= prefs.maxWave &&
    OK_WIND[prefs.wind].includes(wk) &&
    (h.windSpeed ?? 0) <= prefs.maxWind &&
    period >= prefs.minPeriod &&
    (prefs.tide.length === 0 || (tide != null && prefs.tide.includes(tide)))
  return { ok, hb, windKind: wk, tide }
}

export type Match = {
  /** YYYY-MM-DD */
  date: string
  /** primeira e última hora (ISO local) */
  start: string
  end: string
  hours: number
  minHb: number
  maxHb: number
  windKinds: WindKind[]
  maxWind: number
  windDir: number | null
  period: number
}

/**
 * Janelas de horas seguidas que batem com o gosto, a partir de `from` (ISO local) até `daysAhead` dias.
 * Uma janela por dia (a mais longa).
 */
export function findMatches(spot: Spot, hours: HourPoint[], prefs: SpotPrefs, from: string, daysAhead = prefs.daysAhead): Match[] {
  const tides = tideStates(hours)
  const last = new Date(`${from.slice(0, 10)}T12:00:00Z`)
  last.setUTCDate(last.getUTCDate() + daysAhead)
  const lastDate = last.toISOString().slice(0, 10)
  const best = new Map<string, Match>()
  let run: { i: number; checks: HourCheck[] }[] = []
  const flush = () => {
    if (run.length >= prefs.minHours) {
      const hs = run.map((r) => hours[r.i])
      const date = hs[0].time.slice(0, 10)
      const hbs = run.map((r) => r.checks[0].hb)
      const m: Match = {
        date,
        start: hs[0].time,
        end: hs[hs.length - 1].time,
        hours: run.length,
        minHb: Math.min(...hbs),
        maxHb: Math.max(...hbs),
        windKinds: [...new Set(run.map((r) => r.checks[0].windKind))],
        maxWind: Math.max(...hs.map((h) => h.windSpeed ?? 0)),
        windDir: hs[Math.floor(hs.length / 2)].windDirection,
        period: Math.max(...hs.map((h) => h.swellPeakPeriod ?? h.swellPeriod ?? h.wavePeriod ?? 0)),
      }
      const cur = best.get(date)
      if (!cur || m.hours > cur.hours) best.set(date, m)
    }
    run = []
  }
  hours.forEach((h, i) => {
    if (h.time < from || h.time.slice(0, 10) > lastDate) return flush()
    const c = checkHour(spot, h, prefs, tides[i])
    // horas seguidas no mesmo dia
    if (c.ok && (run.length === 0 || hours[run[run.length - 1].i].time.slice(0, 10) === h.time.slice(0, 10))) run.push({ i, checks: [c] })
    else {
      flush()
      if (c.ok) run.push({ i, checks: [c] })
    }
  })
  flush()
  return [...best.values()].sort((a, b) => a.start.localeCompare(b.start))
}

const f1 = (v: number) => v.toFixed(1).replace('.', ',')
const hh = (iso: string) => `${iso.slice(11, 13)}h`

/** "qui 12/11 · 06h–10h · 1,0–1,4 m · vento até 12 km/h de 320° NO" */
export function describeMatch(m: Match) {
  const { wd, dm } = dayLabel(m.date)
  const endHour = String(Number(m.end.slice(11, 13)) + 1).padStart(2, '0')
  const size = f1(m.minHb) === f1(m.maxHb) ? `${f1(m.maxHb)} m` : `${f1(m.minHb)}–${f1(m.maxHb)} m`
  return `${wd} ${dm} · ${hh(m.start)}–${endHour}h · ${size} · vento até ${Math.round(m.maxWind)} km/h de ${dirDeg(m.windDir)}`
}

/** resumo curto das preferências */
export function describePrefs(p: SpotPrefs) {
  const parts = [
    `${f1(p.minWave)}–${f1(p.maxWave)} m`,
    WIND_PREF_LABEL[p.wind].toLowerCase(),
    `vento até ${p.maxWind} km/h`,
    `período ≥ ${p.minPeriod} s`,
  ]
  if (p.tide.length) parts.push(`maré ${p.tide.map((t) => TIDE_LABEL[t].toLowerCase()).join('/')}`)
  if (p.dayParts.length === 1) parts.push(p.dayParts[0] === 'manha' ? 'de manhã' : 'à tarde')
  return parts.join(' · ')
}
