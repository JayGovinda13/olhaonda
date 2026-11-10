/** Data e hora cheia agora no fuso de São Paulo: { date: "2026-11-10", hour: "2026-11-10T06:00" }. */
export function localNow(d = new Date()) {
  const s = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(d)
  return { date: s.slice(0, 10), hour: `${s.slice(0, 10)}T${s.slice(11, 13)}:00` }
}
