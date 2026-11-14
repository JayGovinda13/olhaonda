/** Lê o texto dos avisos (gerado em supabase/functions/_shared/core/alerts.ts) e separa em partes para exibir. */
import type { AppNotification } from '../backend'

export type Window = {
  day: string
  hours: string
  size: string
  swell?: string // "176° S, 5 s"
  kj?: string // "93 kJ"
  wind?: string // "92° L, até 6 km/h"
}

export type ParsedBody =
  | { type: 'windows'; lead: string | null; windows: Window[]; more: string | null }
  | { type: 'change'; notes: string[]; windows: Window[] }
  | { type: 'lost'; reasons: { when: string; why: string[] }[] }
  | { type: 'text'; text: string }

/** "dom 15/11 · 16h–19h · 1,1 m · ondulação 176° S, 5 s · 93 kJ · vento 92° L, até 6 km/h" */
function longWindow(s: string): Window | null {
  const p = s.split(' · ').map((x) => x.trim())
  if (p.length < 3 || !/^\S+ \d{1,2}\/\d{1,2}$/.test(p[0]) || !/^\d{2}h/.test(p[1])) return null
  const w: Window = { day: p[0], hours: p[1], size: p[2] }
  for (const x of p.slice(3)) {
    if (x.startsWith('ondulação ')) w.swell = x.slice(10)
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
      return { type: 'change', notes, windows: windows as Window[] }
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
