/**
 * Ciclo de avisos de um pico favorito. Roda no servidor (Edge Function) e, no modo demonstração, no navegador.
 *
 *   parado ──(previsão bate nos próximos dias)──▶ ENTROU   ──▶ ativo
 *   ativo  ──(janelas mudaram de verdade)───────▶ MUDOU    ──▶ ativo
 *   ativo  ──(nenhuma janela bate mais)─────────▶ SAIU (com o motivo) ──▶ parado
 *   parado ──(voltou a bater)───────────────────▶ VOLTOU   ──▶ ativo
 *
 * Enquanto nada muda, não manda nada: "parou de mandar" = estado ativo sem mudança, ou parado depois do SAIU.
 * Uma janela que simplesmente passou (a sessão de ontem acabou) não é "saiu da condição": o estado volta a
 * parado em silêncio e o próximo aviso é um ENTROU novo.
 */
import { checkHour, findMatches, tideStates, type Failure, type Match, type SpotPrefs } from './prefs.ts'
import type { HourPoint } from './openMeteo.ts'
import type { Spot } from './spots.ts'
import { dayLabel, dirDeg } from './surf.ts'

export type AlertState = {
  status: 'idle' | 'active'
  /** o que a pessoa já foi avisada: base para perceber que mudou */
  notified: Match[]
  /** saiu da condição e ainda não voltou: o próximo aviso é "voltou" */
  wasLost: boolean
  /** ISO local da última mensagem enviada */
  lastEventAt: string | null
  /** número do último aviso (garante que o mesmo aviso nunca é gravado duas vezes) */
  seq: number
}

export const EMPTY_ALERT: AlertState = { status: 'idle', notified: [], wasLost: false, lastEventAt: null, seq: 0 }

export type AlertEventType = 'enter' | 'back' | 'change' | 'lost'

export type AlertEvent = {
  type: AlertEventType
  title: string
  /** texto corrido, sem quebra de linha: serve para o sino, o push e as variáveis do WhatsApp */
  body: string
  /** o resumo (janelas) sem o motivo, para as variáveis do modelo de WhatsApp */
  summary: string
  /** o que mudou / por que saiu; vazio em "entrou" e "voltou" */
  reason: string
  /** caminho no site */
  url: string
  /** dia da janela mais próxima (ou da que se foi, em "saiu") */
  sessionDate: string
  seq: number
}

/** intervalo mínimo entre dois avisos de "mudou" no mesmo pico (evita vai-e-volta na beirada da condição) */
const CHANGE_COOLDOWN_H = 8 // no máximo um aviso de mudança a cada 8 h por pico
/** só avisamos mudanças nos próximos dias (a previsão de mais longe oscila toda hora e a janela de 7 dias anda: todo dia entra um dia novo na ponta) */
const NEAR_DAYS = 4
/** a mudança só conta se a janela andou 3 h ou mais, ou o tamanho mudou 0,4 m ou mais */
const MOVED_H = 3
const GREW_M = 0.4
const MAX_LINES = 3

const f1 = (v: number) => v.toFixed(1).replace('.', ',')
const hourNum = (iso: string) => Number(iso.slice(11, 13))
const hh = (iso: string) => `${iso.slice(11, 13)}h`
const endHour = (iso: string) => `${String(hourNum(iso) + 1).padStart(2, '0')}h`
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000)
const hoursBetween = (a: string, b: string) => (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 3_600_000

/** "sáb 22/11 · 06h–10h · 1,0–1,4 m · ondulação 190° S, 12 s · 340 kJ · vento 320° NO, até 8 km/h" */
export function describeSession(m: Match) {
  const { wd, dm } = dayLabel(m.date)
  const size = f1(m.minHb) === f1(m.maxHb) ? `${f1(m.maxHb)} m` : `${f1(m.minHb)}–${f1(m.maxHb)} m`
  const parts = [`${wd} ${dm}`, `${hh(m.start)}–${endHour(m.end)}`, size]
  const [s1, s2] = m.swells ?? []
  parts.push(s1 ? `ondulação ${dirDeg(s1.dir)}, ${Math.round(s1.period)} s` : `ondulação ${dirDeg(m.swellDir)}, ${Math.round(m.period)} s`)
  if (s2) parts.push(`2ª ondulação ${dirDeg(s2.dir)}, ${Math.round(s2.period)} s`) // o 2º swell pode vir de outra direção e quebrar grande
  if (m.kj != null) parts.push(`${Math.round(m.kj)} kJ`)
  parts.push(`vento ${dirDeg(m.windDir)}, até ${Math.round(m.maxWind)} km/h`)
  return parts.join(' · ')
}

const sizeOf = (m: Match) => (f1(m.minHb) === f1(m.maxHb) ? `${f1(m.maxHb)} m` : `${f1(m.minHb)}–${f1(m.maxHb)} m`)
const hoursAndSize = (m: Match) => `${hh(m.start)}–${endHour(m.end)}, ${sizeOf(m)}`
/** "qui 19/11, 06h–10h, 1,5 m": versão curta para os avisos de mudança */
const shortSession = (m: Match) => `${dayShort(m.date)}, ${hoursAndSize(m)}`

const dayShort = (date: string) => {
  const { wd, dm } = dayLabel(date)
  return `${wd} ${dm}`
}

/** quando é a primeira janela: "hoje", "amanhã" ou "daqui a 5 dias" */
export function inDays(from: string, date: string) {
  const n = daysBetween(from.slice(0, 10), date)
  if (n <= 0) return 'hoje'
  if (n === 1) return 'amanhã'
  return `daqui a ${n} dias`
}

function listSessions(ms: Match[]) {
  const shown = ms.slice(0, MAX_LINES).map(describeSession)
  const extra = ms.length - shown.length
  return shown.join('; ') + (extra > 0 ? `; e mais ${extra} ${extra === 1 ? 'dia' : 'dias'}` : '')
}

/**
 * Por que um dia deixou de bater: pega a hora do dia que ficou mais perto de bater e lista o que falhou nela.
 * Se as horas boas existem mas são menos seguidas do que o pedido, diz isso.
 */
export function explainDate(spot: Spot, hours: HourPoint[], prefs: SpotPrefs, date: string): string {
  const tides = tideStates(hours)
  const day = hours.map((h, i) => ({ h, i })).filter((x) => x.h.time.startsWith(date) && hourNum(x.h.time) >= 5 && hourNum(x.h.time) <= 18)
  if (!day.length) return `${dayShort(date)}: o dia saiu do alcance da previsão`
  const parts = prefs.dayParts
  const considered = day.filter(({ h }) => {
    const n = hourNum(h.time)
    return parts.length === 0 || (parts.includes('manha') && n <= 11) || (parts.includes('tarde') && n >= 12)
  })
  const checks = (considered.length ? considered : day).map(({ h, i }) => ({ h, c: checkHour(spot, h, { ...prefs, dayParts: [] }, tides[i]) }))
  const okRun = (() => {
    let best = 0
    let cur = 0
    for (const { c } of checks) {
      cur = c.ok ? cur + 1 : 0
      best = Math.max(best, cur)
    }
    return best
  })()
  if (okRun > 0 && okRun < prefs.minHours) return `${dayShort(date)}: só ${okRun} hora seguida boa (você pediu aviso só com 2 horas ou mais)`
  // a hora com menos falhas; no empate, a que erra por menos tamanho/vento (a primeira da lista serve)
  const best = checks.reduce((a, b) => (b.c.failures.length < a.c.failures.length ? b : a))
  if (!best.c.failures.length) return `${dayShort(date)}: as condições mudaram`
  return `${dayShort(date)} (${hh(best.h.time)}): ${best.c.failures.map((f: Failure) => f.text).join('; ')}`
}

type Diff = { removed: Match[]; added: Match[]; shifted: { before: Match; after: Match }[] }

function diffSessions(before: Match[], after: Match[], nearDate: string): Diff {
  const byDate = (l: Match[]) => new Map(l.map((m) => [m.date, m]))
  const b = byDate(before)
  const a = byDate(after)
  const removed = before.filter((m) => !a.has(m.date) && m.date <= nearDate)
  const added = after.filter((m) => !b.has(m.date) && m.date <= nearDate)
  const shifted: Diff['shifted'] = []
  for (const m of after) {
    const old = b.get(m.date)
    if (!old || m.date > nearDate) continue
    const moved = Math.abs(hourNum(m.start) - hourNum(old.start)) >= MOVED_H || Math.abs(hourNum(m.end) - hourNum(old.end)) >= MOVED_H
    const grew = Math.abs((m.minHb + m.maxHb) / 2 - (old.minHb + old.maxHb) / 2) >= GREW_M
    if (moved || grew) shifted.push({ before: old, after: m })
  }
  return { removed, added, shifted }
}

const url = (spot: Spot, m?: Match) => `/pico/${spot.id}${m ? `?t=${encodeURIComponent(m.start)}` : ''}`

/** o que "sessões passadas" significa: a janela terminou antes de agora */
const passed = (m: Match, nowHour: string) => m.end < nowHour

/**
 * Confere a previsão de um favorito e devolve o novo estado e, se for o caso, o aviso a enviar.
 * `now.hour` é a hora cheia em São Paulo (localNow().hour).
 */
export function evaluateAlert(
  spot: Spot,
  hours: HourPoint[],
  prefs: SpotPrefs,
  state: AlertState,
  now: { date: string; hour: string },
): { state: AlertState; event: AlertEvent | null } {
  const window = Math.min(7, Math.max(1, prefs.daysAhead || 7))
  const cur = findMatches(spot, hours, prefs, now.hour, window)
  const live = state.notified.filter((m) => !passed(m, now.hour)) // sessões já avisadas que ainda não acabaram

  const emit = (type: AlertEventType, ms: Match[], reason: string, titleSuffix: string, next: Partial<AlertState>): { state: AlertState; event: AlertEvent } => {
    const seq = state.seq + 1
    const summary = ms.length ? listSessions(ms) : ''
    const lead = type === 'enter' || type === 'back' ? `Primeira janela ${inDays(now.hour, ms[0].date)}. ` : ''
    const body =
      type === 'lost'
        ? `Motivo: ${reason}. Aviso de novo se voltar a bater.`
        : type === 'change'
          ? `${reason}${ms.length ? ` Agora: ${ms.slice(0, MAX_LINES).map(shortSession).join('; ')}${ms.length > MAX_LINES ? '…' : ''}.` : ''}`
          : `${lead}${summary}.`
    return {
      state: { status: next.status ?? 'active', notified: next.notified ?? ms, wasLost: next.wasLost ?? false, lastEventAt: now.hour, seq },
      event: { type, title: `${spot.name}: ${titleSuffix}`, body, summary, reason, url: url(spot, ms[0]), sessionDate: (ms[0] ?? live[0] ?? state.notified[0])?.date ?? now.date, seq },
    }
  }

  if (state.status === 'idle') {
    if (!cur.length) return { state: { ...state, notified: [] }, event: null }
    return emit(state.wasLost ? 'back' : 'enter', cur, '', state.wasLost ? 'voltou a ficar do seu gosto' : 'condição do seu gosto', { notified: cur })
  }

  // ativo
  if (!live.length) {
    // tudo o que foi avisado já passou: não é "saiu da condição"
    if (!cur.length) return { state: { ...EMPTY_ALERT, seq: state.seq, lastEventAt: state.lastEventAt }, event: null }
    return emit('enter', cur, '', 'nova janela do seu gosto', { notified: cur })
  }

  if (!cur.length) {
    const reasons = live.slice(0, 2).map((m) => explainDate(spot, hours, prefs, m.date))
    const reason = reasons.join(' | ')
    const first = live[0]
    const r = emit('lost', [], reason, 'saiu da sua condição', { status: 'idle', notified: [], wasLost: true })
    r.event.sessionDate = first.date
    r.event.url = url(spot, first)
    return r as { state: AlertState; event: AlertEvent }
  }

  const near = new Date(`${now.date}T12:00:00Z`)
  near.setUTCDate(near.getUTCDate() + NEAR_DAYS)
  const d = diffSessions(live, cur, near.toISOString().slice(0, 10))
  const material = d.removed.length + d.added.length + d.shifted.length > 0
  if (!material) return { state: { ...state, notified: live }, event: null }
  if (state.lastEventAt && hoursBetween(state.lastEventAt, now.hour) < CHANGE_COOLDOWN_H) return { state, event: null } // espera o próximo ciclo

  const lines: string[] = []
  for (const m of d.removed.slice(0, 2)) lines.push(`Saiu: ${explainDate(spot, hours, prefs, m.date)}.`)
  for (const m of d.added.slice(0, 2)) lines.push(`Entrou: ${shortSession(m)}.`)
  for (const s of d.shifted.slice(0, 2)) {
    lines.push(`Mudou ${dayShort(s.after.date)}: era ${hoursAndSize(s.before)}, agora ${hoursAndSize(s.after)}.`)
  }
  return emit('change', cur, lines.join(' '), 'a previsão mudou', { notified: cur })
}

/** Mensagem curta para o fim do aviso de "mudou" e de "saiu" no WhatsApp (e para testes). */
export const ALERT_LABEL: Record<AlertEventType, string> = {
  enter: 'Entrou na sua condição',
  back: 'Voltou a ficar do seu gosto',
  change: 'A previsão mudou',
  lost: 'Saiu da sua condição',
}
