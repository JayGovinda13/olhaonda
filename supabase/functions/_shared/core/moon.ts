/**
 * Fase da Lua por cálculo astronômico (mês sinódico médio a partir de uma lua nova de referência).
 * Precisão de algumas horas: suficiente para a fase do dia e para as próximas luas.
 */
const SYNODIC = 29.530588853 // dias
const REF_NEW = Date.UTC(2000, 0, 6, 18, 14) // lua nova de 6/jan/2000 18:14 UTC
const DAY = 86_400_000

export type MoonInfo = {
  /** 0 = nova, 0,25 = quarto crescente, 0,5 = cheia, 0,75 = quarto minguante */
  phase: number
  /** fração iluminada, 0–1 */
  illumination: number
  name: string
  /** sizígia (lua nova/cheia: marés de maior amplitude) ou quadratura (quartos: menor amplitude) */
  tideKind: 'sizígia' | 'quadratura' | null
  next: { name: string; date: Date }[]
}

const NAMES = ['Nova', 'Crescente', 'Quarto crescente', 'Crescente gibosa', 'Cheia', 'Minguante gibosa', 'Quarto minguante', 'Minguante']

function phaseAt(ms: number) {
  const p = ((ms - REF_NEW) / DAY / SYNODIC) % 1
  return p < 0 ? p + 1 : p
}

export function moonInfo(date: Date): MoonInfo {
  const phase = phaseAt(date.getTime())
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2
  // fases principais ocupam ~1 dia de cada lado
  const days = phase * SYNODIC
  const near = (target: number) => Math.abs(((days - target * SYNODIC + SYNODIC * 1.5) % SYNODIC) - SYNODIC / 2) < 1.1
  let name: string
  if (near(0)) name = NAMES[0]
  else if (near(0.25)) name = NAMES[2]
  else if (near(0.5)) name = NAMES[4]
  else if (near(0.75)) name = NAMES[6]
  else name = phase < 0.25 ? NAMES[1] : phase < 0.5 ? NAMES[3] : phase < 0.75 ? NAMES[5] : NAMES[7]
  // a maré responde à lua com ~1–2 dias de atraso ("idade da maré"); janela de ±2 dias
  const nearTide = (target: number) => Math.abs(((days - target * SYNODIC - 1 + SYNODIC * 1.5) % SYNODIC) - SYNODIC / 2) < 2.5
  const tideKind = nearTide(0) || nearTide(0.5) ? 'sizígia' : nearTide(0.25) || nearTide(0.75) ? 'quadratura' : null
  const next = [0, 0.25, 0.5, 0.75]
    .map((target) => {
      let d = (target - phase) * SYNODIC
      if (d <= 0.05) d += SYNODIC
      return { name: NAMES[target * 8 === 0 ? 0 : target * 8], date: new Date(date.getTime() + d * DAY) }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  return { phase, illumination, name, tideKind, next }
}
