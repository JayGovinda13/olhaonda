/** Marcações (@apelido) no fórum. */

/** apelido: 3 a 24 letras minúsculas, números, ponto e sublinhado; "@" precisa estar no começo ou depois de espaço/pontuação (e-mail não vale) */
export const MENTION_RE = /(^|[^A-Za-z0-9_.])@([A-Za-z0-9_.]{3,24})/g

/** o ponto final de uma frase ("valeu @ana.") não faz parte do apelido */
const clean = (u: string) => u.replace(/\.+$/, '')

/** apelidos marcados no texto (minúsculos, sem repetir, no máximo 5) */
export function extractMentions(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(MENTION_RE)) {
    const u = clean(m[2]).toLowerCase()
    if (u.length >= 3) out.add(u)
  }
  return [...out].slice(0, 5)
}

/** pedaços do texto: texto comum e marcações, para mostrar as marcações em destaque */
export function splitMentions(text: string): { text: string; mention?: string }[] {
  const parts: { text: string; mention?: string }[] = []
  let last = 0
  for (const m of text.matchAll(MENTION_RE)) {
    const start = (m.index ?? 0) + m[1].length
    const handle = clean(m[2])
    if (handle.length < 3) continue
    if (start > last) parts.push({ text: text.slice(last, start) })
    parts.push({ text: '@' + handle, mention: handle.toLowerCase() })
    last = start + 1 + handle.length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

/** a marcação que está sendo digitada logo antes do cursor: "oi @le" -> { start: 3, query: "le" } */
export function activeMention(text: string, caret: number): { start: number; query: string } | null {
  const m = /(^|[^A-Za-z0-9_.])@([A-Za-z0-9_.]{0,24})$/.exec(text.slice(0, caret))
  if (!m) return null
  return { start: caret - m[2].length - 1, query: m[2] }
}
