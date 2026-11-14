/**
 * Condições favoritas de um pico e a busca das horas da previsão que batem com elas.
 * Usado pela tela "Meus picos" (prévia), pelos alertas do modo demonstração e pela Edge Function diária.
 */
import { surfEstimate } from './breaking.ts'
import type { HourPoint } from './openMeteo.ts'
import type { Spot } from './spots.ts'
import { angleDiff, dayLabel, dirDeg, waveEnergy, WIND_LABEL, windKind, type WindKind } from './surf.ts'

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
  /** 2 = só avisa se a condição durar 2 horas seguidas ou mais (padrão); 1 = avisa mesmo se for só 1 hora */
  minHours: 1 | 2
  /** quantos dias à frente avisar (padrão 7) */
  daysAhead: number
  /** direção da ondulação principal (graus, de onde vem) com tolerância ±; null = qualquer direção */
  swellDir: number | null
  swellDirTol: number
  /** período máximo do swell (s); null = sem limite */
  maxPeriod: number | null
  /** potência da onda (kJ por onda e metro de crista, a mesma "Força" do site); null = sem limite */
  minPower: number | null
  maxPower: number | null
  /** direção do vento em graus (de onde sopra) com tolerância ±; null = vale o tipo (terral/lateral/qualquer) */
  windDir: number | null
  windDirTol: number
  /** vento mínimo (km/h): 0 aceita calmaria */
  minWind: number
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
  daysAhead: 7,
  swellDir: null,
  swellDirTol: 45,
  maxPeriod: null,
  minPower: null,
  maxPower: null,
  windDir: null,
  windDirTol: 45,
  minWind: 0,
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
  const n = { ...DEFAULT_PREFS, ...(p ?? {}) }
  n.minHours = n.minHours === 1 ? 1 : 2 // só existem duas opções (valores antigos, de 3 a 5, viram 2)
  return n
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

export type FailKey = 'tamanho' | 'swellDir' | 'periodo' | 'potencia' | 'ventoDir' | 'vento' | 'ventoVel' | 'mare'
export type Failure = { key: FailKey; text: string }
export type HourCheck = {
  ok: boolean
  hb: number
  windKind: WindKind
  tide: TideState | null
  /** o que não bateu nesta hora (vazio quando ok), já escrito para a pessoa */
  failures: Failure[]
  /** ondulação dominante na praia */
  swellDir: number | null
  swellPeriod: number
  kj: number | null
}

const f1 = (v: number) => v.toFixed(1).replace('.', ',')
const range = (lo: number | null, hi: number | null, unit: string, dec = false) => {
  const n = (v: number) => (dec ? f1(v) : String(Math.round(v)))
  if (lo != null && hi != null) return `${n(lo)} a ${n(hi)} ${unit}`
  if (lo != null) return `${n(lo)} ${unit} ou mais`
  return `até ${n(hi!)} ${unit}`
}

/** confere uma hora contra as preferências e diz, em português, o que não bateu */
export function checkHour(spot: Spot, h: HourPoint, prefs: SpotPrefs, tide: TideState | null): HourCheck {
  const est = surfEstimate(spot, h)
  const hb = est?.hb ?? 0
  const dominant = est?.trains.length ? [...est.trains].sort((a, b) => b.hb - a.hb)[0] : null
  const swellDir = dominant?.dir ?? h.swellDirection ?? h.waveDirection ?? null
  const period = dominant?.period ?? h.swellPeakPeriod ?? h.swellPeriod ?? h.wavePeriod ?? 0
  const kj = waveEnergy(h)
  const wk = windKind(spot, h.windDirection, h.windSpeed)
  const ws = h.windSpeed ?? 0
  const part = partOf(h.time)
  const failures: Failure[] = []
  const fail = (key: FailKey, text: string) => failures.push({ key, text })

  if (hb < prefs.minWave || hb > prefs.maxWave) fail('tamanho', `ondas de ${f1(hb)} m (você quer ${f1(prefs.minWave)} a ${f1(prefs.maxWave)} m)`)
  if (prefs.swellDir != null && (swellDir == null || angleDiff(swellDir, prefs.swellDir) > prefs.swellDirTol))
    fail('swellDir', `ondulação de ${dirDeg(swellDir)} (você quer ${dirDeg(prefs.swellDir)} ±${prefs.swellDirTol}°)`)
  if (period < prefs.minPeriod || (prefs.maxPeriod != null && period > prefs.maxPeriod))
    fail('periodo', `período de ${Math.round(period)} s (você quer ${range(prefs.minPeriod, prefs.maxPeriod, 's')})`)
  if ((prefs.minPower != null || prefs.maxPower != null) && (kj == null || (prefs.minPower != null && kj < prefs.minPower) || (prefs.maxPower != null && kj > prefs.maxPower)))
    fail('potencia', `força de ${kj == null ? '—' : Math.round(kj)} kJ (você quer ${range(prefs.minPower, prefs.maxPower, 'kJ')})`)
  // vento: direção em graus (quando o vento é fraco demais para ter direção útil, vale) ou o tipo; e a velocidade
  const dirBad =
    prefs.windDir != null
      ? h.windDirection != null && ws >= 6 && angleDiff(h.windDirection, prefs.windDir) > prefs.windDirTol
      : !OK_WIND[prefs.wind].includes(wk)
  const spdBad = ws > prefs.maxWind || ws < prefs.minWind
  const wantDir = prefs.windDir != null ? `${dirDeg(prefs.windDir)} ±${prefs.windDirTol}°` : WIND_PREF_LABEL[prefs.wind].toLowerCase()
  const wantSpd = range(prefs.minWind > 0 ? prefs.minWind : null, prefs.maxWind, 'km/h')
  const now = prefs.windDir != null ? `vento de ${dirDeg(h.windDirection)}` : `${WIND_LABEL[wk].toLowerCase()} de ${dirDeg(h.windDirection)}`
  if (dirBad && spdBad) fail('ventoDir', `${now}, ${Math.round(ws)} km/h (você quer ${wantDir}, ${wantSpd})`)
  else if (dirBad) fail(prefs.windDir != null ? 'ventoDir' : 'vento', `${now} (você quer ${wantDir})`)
  else if (spdBad) fail('ventoVel', `vento de ${Math.round(ws)} km/h (você quer ${wantSpd})`)
  if (prefs.tide.length && (tide == null || !prefs.tide.includes(tide)))
    fail('mare', `maré ${tide ? TIDE_LABEL[tide].toLowerCase() : 'sem dado'} (você quer ${prefs.tide.map((t) => TIDE_LABEL[t].toLowerCase()).join(' ou ')})`)

  const inPart = part != null && (prefs.dayParts.length === 0 || prefs.dayParts.includes(part))
  return { ok: inPart && failures.length === 0, hb, windKind: wk, tide, failures, swellDir, swellPeriod: period, kj }
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
  /** ondulação dominante no meio da janela e potência máxima (kJ) */
  swellDir: number | null
  kj: number | null
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
        swellDir: run[Math.floor(run.length / 2)].checks[0].swellDir,
        kj: Math.max(...run.map((r) => r.checks[0].kj ?? 0)) || null,
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
  const parts = [`${f1(p.minWave)}–${f1(p.maxWave)} m`]
  if (p.swellDir != null) parts.push(`ondulação de ${dirDeg(p.swellDir)} ±${p.swellDirTol}°`)
  parts.push(`período ${p.maxPeriod != null ? `${p.minPeriod}–${p.maxPeriod}` : `≥ ${p.minPeriod}`} s`)
  if (p.minPower != null || p.maxPower != null) parts.push(`força ${range(p.minPower, p.maxPower, 'kJ')}`)
  parts.push(p.windDir != null ? `vento de ${dirDeg(p.windDir)} ±${p.windDirTol}°` : WIND_PREF_LABEL[p.wind].toLowerCase())
  parts.push(p.minWind > 0 ? `${p.minWind}–${p.maxWind} km/h` : `até ${p.maxWind} km/h`)
  if (p.tide.length) parts.push(`maré ${p.tide.map((t) => TIDE_LABEL[t].toLowerCase()).join('/')}`)
  if (p.dayParts.length === 1) parts.push(p.dayParts[0] === 'manha' ? 'de manhã' : 'à tarde')
  return parts.join(' · ')
}
