import { SPOTS, type Spot } from './spots'

/**
 * Navegação em níveis: estado → cidade → pico.
 * Hoje a produção só tem SP (litoral paulista); com um estado só, o nível de estado é pulado.
 */
export type Place = { key: string; name: string; lat: number; lon: number; count: number }

const center = (spots: Spot[]) => ({
  lat: spots.reduce((a, s) => a + s.lat, 0) / spots.length,
  lon: spots.reduce((a, s) => a + s.lon, 0) / spots.length,
})

export const STATE_NAMES: Record<string, string> = {
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  PR: 'Paraná',
  SP: 'São Paulo',
  RJ: 'Rio de Janeiro',
  ES: 'Espírito Santo',
  BA: 'Bahia',
  SE: 'Sergipe',
  AL: 'Alagoas',
  PE: 'Pernambuco',
  PB: 'Paraíba',
  RN: 'Rio Grande do Norte',
  CE: 'Ceará',
}

/** Estados na ordem da lista de picos (sul → norte). */
export function states(): Place[] {
  const out: Place[] = []
  for (const s of SPOTS) {
    if (out.some((p) => p.key === s.state)) continue
    const inState = SPOTS.filter((x) => x.state === s.state)
    out.push({ key: s.state, name: STATE_NAMES[s.state] ?? s.state, count: inState.length, ...center(inState) })
  }
  return out
}

/** Cidades de um estado, na ordem da lista (sudoeste → nordeste). */
export function cities(state: string): Place[] {
  const out: Place[] = []
  for (const s of SPOTS.filter((x) => x.state === state)) {
    if (out.some((p) => p.key === s.city)) continue
    const inCity = SPOTS.filter((x) => x.state === state && x.city === s.city)
    out.push({ key: s.city, name: s.city, count: inCity.length, ...center(inCity) })
  }
  return out
}

export function spotsIn(state: string, city: string) {
  return SPOTS.filter((s) => s.state === state && s.city === city)
}

/** Caixa que envolve pontos (para enquadrar o mapa). */
export function bounds(points: { lat: number; lon: number }[]): [[number, number], [number, number]] {
  const lons = points.map((p) => p.lon)
  const lats = points.map((p) => p.lat)
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ]
}
