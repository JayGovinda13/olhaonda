import type { HourPoint } from './openMeteo.ts'
import { distanceKm, type Spot } from './spots.ts'

/**
 * Portos de referência das tábuas de maré da Marinha do Brasil (DHN/CHM).
 *
 * As tábuas da Marinha dão as alturas em metros ACIMA DO NÍVEL DE REDUÇÃO (NR), um "zero"
 * próximo da média das baixa-mares de sizígia. A Open-Meteo dá o nível em relação ao NÍVEL
 * MÉDIO do mar. Para converter: altura_NR = nível_médio + Z0, onde Z0 é a altura do nível
 * médio acima do NR, publicada no cabeçalho de cada estação ("Nível Médio").
 *
 * ATENÇÃO: os valores de Z0 abaixo são ESTIMATIVAS. Confira cada um no cabeçalho da tábua
 * oficial em https://www.marinha.mil.br/chm/tabuas-de-mare e troque `verified` para true.
 */
export type TidePort = {
  id: string
  name: string
  lat: number
  lon: number
  /** Nível médio acima do nível de redução (m). */
  z0: number
  verified: boolean
}

export const TIDE_PORTS: TidePort[] = [
  { id: 'imbituba', name: 'Porto de Imbituba (SC)', lat: -28.23, lon: -48.65, z0: 0.4, verified: false },
  { id: 'florianopolis', name: 'Florianópolis (SC)', lat: -27.58, lon: -48.56, z0: 0.55, verified: false },
  { id: 'paranagua', name: 'Porto de Paranaguá (PR)', lat: -25.5, lon: -48.52, z0: 0.8, verified: false },
  { id: 'santos', name: 'Porto de Santos (SP)', lat: -23.98, lon: -46.3, z0: 0.75, verified: false },
  { id: 'saosebastiao', name: 'Porto de São Sebastião (SP)', lat: -23.81, lon: -45.4, z0: 0.65, verified: false },
  { id: 'ubatuba', name: 'Ubatuba (SP)', lat: -23.5, lon: -45.12, z0: 0.65, verified: false },
  { id: 'ilhafiscal', name: 'Rio de Janeiro, Ilha Fiscal (RJ)', lat: -22.9, lon: -43.17, z0: 0.69, verified: false },
  { id: 'cabofrio', name: 'Arraial do Cabo (RJ)', lat: -22.97, lon: -42.02, z0: 0.65, verified: false },
  { id: 'vitoria', name: 'Porto de Vitória (ES)', lat: -20.32, lon: -40.34, z0: 0.8, verified: false },
  { id: 'ilheus', name: 'Porto de Ilhéus (BA)', lat: -14.78, lon: -39.03, z0: 1.1, verified: false },
  { id: 'salvador', name: 'Porto de Salvador (BA)', lat: -12.97, lon: -38.52, z0: 1.3, verified: false },
  { id: 'maceio', name: 'Porto de Maceió (AL)', lat: -9.68, lon: -35.73, z0: 1.1, verified: false },
  { id: 'recife', name: 'Porto do Recife (PE)', lat: -8.05, lon: -34.87, z0: 1.2, verified: false },
  { id: 'natal', name: 'Porto de Natal (RN)', lat: -5.77, lon: -35.2, z0: 1.3, verified: false },
  { id: 'mucuripe', name: 'Fortaleza, Mucuripe (CE)', lat: -3.72, lon: -38.48, z0: 1.5, verified: false },
  { id: 'noronha', name: 'Fernando de Noronha (PE)', lat: -3.83, lon: -32.4, z0: 1.2, verified: false },
]

/** Porto de referência mais próximo do pico. */
export function tidePortFor(spot: Spot): TidePort {
  const fixed = spot.tidePort && TIDE_PORTS.find((p) => p.id === spot.tidePort)
  if (fixed) return fixed
  return TIDE_PORTS.reduce((best, p) =>
    distanceKm(spot.lat, spot.lon, p.lat, p.lon) < distanceKm(spot.lat, spot.lon, best.lat, best.lon) ? p : best,
  )
}

export type Extreme = { time: string; level: number; kind: 'alta' | 'baixa' }

/** Padrão das tábuas da Marinha: metros com uma casa decimal. */
export const m1 = (v: number) => `${v.toFixed(1).replace('.', ',')} m`

/**
 * Preamares e baixa-mares com precisão de minutos: ajusta uma parábola pelos três pontos
 * horários em volta de cada pico/vale e pega o vértice (os dados vêm de hora em hora).
 */
export function extremes(hours: HourPoint[]): Extreme[] {
  const out: Extreme[] = []
  for (let i = 1; i < hours.length - 1; i++) {
    const [a, b, c] = [hours[i - 1].seaLevel, hours[i].seaLevel, hours[i + 1].seaLevel]
    if (a == null || b == null || c == null) continue
    const isHigh = b > a && b >= c
    const isLow = b < a && b <= c
    if (!isHigh && !isLow) continue
    const denom = a - 2 * b + c
    const dt = denom === 0 ? 0 : Math.max(-0.5, Math.min(0.5, (a - c) / (2 * denom))) // em horas
    const level = b - ((a - c) * dt) / 4
    const base = new Date(`${hours[i].time}:00Z`)
    const t = new Date(base.getTime() + Math.round(dt * 60) * 60_000).toISOString().slice(0, 16)
    out.push({ time: t, level, kind: isHigh ? 'alta' : 'baixa' })
  }
  return out
}
