import { SPOTS, type Spot } from './spots'

/**
 * Navegação em níveis: estado → cidade → pico.
 * A produção tem SC, SP, RJ, ES, AL, CE e AP: a página inicial começa no estado; com um estado só, esse nível é pulado.
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
  AP: 'Amapá',
}

/** Ordem alfabética em português (acentos não atrapalham: "Águas" vem junto do "A"). */
const byName = (a: Place, b: Place) => a.name.localeCompare(b.name, 'pt-BR')

/** Estados em ordem alfabética. */
export function states(): Place[] {
  const out: Place[] = []
  for (const s of SPOTS) {
    if (out.some((p) => p.key === s.state)) continue
    const inState = SPOTS.filter((x) => x.state === s.state)
    out.push({ key: s.state, name: STATE_NAMES[s.state] ?? s.state, count: inState.length, ...center(inState) })
  }
  return out.sort(byName)
}

/** Cidades de um estado em ordem alfabética. */
export function cities(state: string): Place[] {
  const out: Place[] = []
  for (const s of SPOTS.filter((x) => x.state === state)) {
    if (out.some((p) => p.key === s.city)) continue
    const inCity = SPOTS.filter((x) => x.state === state && x.city === s.city)
    out.push({ key: s.city, name: s.city, count: inCity.length, ...center(inCity) })
  }
  return out.sort(byName)
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

/** Picos para os seletores: estado e cidade em ordem alfabética; dentro da cidade, a ordem da lista (pela costa). */
export const SPOTS_BY_PLACE: Spot[] = [...SPOTS].sort(
  (a, b) =>
    (STATE_NAMES[a.state] ?? a.state).localeCompare(STATE_NAMES[b.state] ?? b.state, 'pt-BR') ||
    (a.region ?? a.city).localeCompare(b.region ?? b.city, 'pt-BR'),
)
