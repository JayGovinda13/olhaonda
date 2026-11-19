/** Lê o texto dos avisos (gerado em supabase/functions/_shared/core/alerts.ts) e separa em partes para exibir. */
import type { AppNotification } from '../backend'

export type Window = {
  day: string
  hours: string
  size: string
  swell?: string // "176° S, 5 s"
  swell2?: string // 2º swell: "110° ESE, 13 s"
  kj?: string // "93 kJ"
  wind?: string // "92° L, até 6 km/h"
}

/** uma linha do aviso de "mudou": entrou um dia, a janela mudou, ou um dia saiu */
export type ChangeRow = { tag: 'Entrou' | 'Mudou' | 'Saiu'; day: string; hours?: string; size?: string; before?: string; after?: string; why?: string[] }

export type ParsedBody =
  | { type: 'windows'; lead: string | null; windows: Window[]; more: string | null }
  | { type: 'change'; rows: ChangeRow[]; notes: string[]; windows: Window[] }
  | { type: 'lost'; reasons: { when: string; why: string[] }[] }
  | { type: 'text'; text: string }

/** "dom 15/11 · 16h–19h · 1,1 m · ondulação 176° S, 5 s · 93 kJ · vento 92° L, até 6 km/h" */
function longWindow(s: string): Window | null {
  const p = s.split(' · ').map((x) => x.trim())
  if (p.length < 3 || !/^\S+ \d{1,2}\/\d{1,2}$/.test(p[0]) || !/^\d{2}h/.test(p[1])) return null
  const w: Window = { day: p[0], hours: p[1], size: p[2] }
  for (const x of p.slice(3)) {
    if (x.startsWith('ondulação ')) w.swell = x.slice(10)
    else if (x.startsWith('2ª ondulação ')) w.swell2 = x.slice(13)
    else if (/ kJ$/.test(x)) w.kj = x
    else if (x.startsWith('vento ')) w.wind = x.slice(6)
  }
  return w
}

/** "qui 19/11, 06h–10h, 1,5 m" (avisos de mudança) */
function shortWindow(s: string): Window | null {
  const m = /^(\S+ \d{1,2}\/\d{1,2}), (\d{2}h–\d{2}h), (.+)$/.exec(s.trim())
  return m ? { day: m[1], hours: m[2], size: m[3] } : null
}

export function parseBody(n: Pick<AppNotification, 'kind' | 'body'>): ParsedBody {
  const body = n.body.trim()

  if (n.kind === 'lost') {
    const m = /^Motivo: (.*?)\.? Aviso de novo se voltar a bater\.?$/s.exec(body)
    if (m) {
      const reasons = m[1].split(' | ').map((r) => {
        const d = /^(\S+ \d{1,2}\/\d{1,2}(?: \(\d{2}h\))?): (.*)$/s.exec(r)
        return d ? { when: d[1], why: d[2].split('; ') } : { when: '', why: [r] }
      })
      return { type: 'lost', reasons }
    }
  }

  if (n.kind === 'change') {
    const i = body.indexOf(' Agora: ')
    const notesText = i >= 0 ? body.slice(0, i) : body
    const nowText = i >= 0 ? body.slice(i + 8).replace(/…?\.$/, '') : ''
    const windows = nowText ? nowText.split('; ').map(shortWindow) : []
    if (windows.every(Boolean)) {
      const notes = notesText.split(/(?<=\.) (?=[A-ZÁÉÍÓÚ])/).map((x) => x.trim()).filter(Boolean)
      const rows = notes.map(parseChangeNote)
      return { type: 'change', rows: rows.every(Boolean) ? (rows as ChangeRow[]) : [], notes, windows: windows as Window[] }
    }
  }

  if (n.kind === 'enter' || n.kind === 'back' || n.kind === 'match') {
    let rest = body.replace(/\.$/, '')
    let lead: string | null = null
    const l = /^(Primeira janela [^.]+)\. (.*)$/s.exec(rest)
    if (l) {
      lead = l[1]
      rest = l[2]
    }
    const parts = rest.split('; ')
    let more: string | null = null
    const last = parts[parts.length - 1]
    if (/^e mais \d+ dias?$/.test(last)) more = parts.pop()!.replace('e mais', '+')
    const windows = parts.map(longWindow)
    if (windows.length && windows.every(Boolean)) return { type: 'windows', lead, windows: windows as Window[], more }
  }

  return { type: 'text', text: body }
}

/** "dom 15/11" + data do aviso → "2026-11-15" (o ano vem da data em que o aviso foi criado; vira o ano se precisar) */
function dateOf(dayLabel: string, createdAt: string): string | null {
  const m = /(\d{1,2})\/(\d{1,2})/.exec(dayLabel)
  if (!m) return null
  const created = Date.parse(createdAt)
  if (Number.isNaN(created)) return null
  const y0 = new Date(created).getUTCFullYear()
  for (const y of [y0, y0 + 1]) {
    const d = Date.UTC(y, Number(m[2]) - 1, Number(m[1]))
    if (d >= created - 2 * 86_400_000) return new Date(d).toISOString().slice(0, 10)
  }
  return null
}

/**
 * Endereço do pico no dia e na hora de uma janela do aviso: abre a previsão exatamente naquele horário
 * (e não na primeira janela do aviso). `day` = "dom 15/11"; `hours` = "16h–19h" ou "(05h)"; sem hora, 7h.
 */
export function windowHref(spotId: string, day: string, hours: string | undefined, createdAt: string): string | null {
  const date = dateOf(day, createdAt)
  if (!date) return null
  const hh = /(\d{1,2})h/.exec(hours ?? '')?.[1]
  return `/pico/${spotId}?t=${encodeURIComponent(`${date}T${String(hh ?? 7).padStart(2, '0')}:00`)}`
}

/** "Mudou ter 17/11: era 05h–11h, 1,5 m, agora 08h–13h, 1,5 m." / "Entrou: qui 19/11, 06h–10h, 1,5 m." / "Saiu: ter 17/11 (05h): motivo; motivo." */
function parseChangeNote(note: string): ChangeRow | null {
  const day = '(\\S+ \\d{1,2}\\/\\d{1,2})'
  let m = new RegExp(`^Mudou ${day}: era (\\d{2}h–\\d{2}h), (.+?), agora (\\d{2}h–\\d{2}h), (.+?)\\.?$`).exec(note)
  if (m) return { tag: 'Mudou', day: m[1], hours: m[4], size: m[5], before: `${m[2]} · ${m[3]}`, after: `${m[4]} · ${m[5]}` }
  m = new RegExp(`^Entrou: ${day}, (\\d{2}h–\\d{2}h), (.+?)\\.?$`).exec(note)
  if (m) return { tag: 'Entrou', day: m[1], hours: m[2], size: m[3] }
  m = new RegExp(`^Saiu: ${day}( \\((\\d{2}h)\\))?: (.*?)\\.?$`).exec(note)
  if (m) return { tag: 'Saiu', day: m[1], hours: m[3] ? `${m[3]}` : undefined, why: m[4].split('; ') }
  return null
}
