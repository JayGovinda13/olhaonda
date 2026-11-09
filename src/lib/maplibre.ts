/**
 * Carregamento sob demanda do MapLibre (só quando um mapa aparece na tela).
 * O worker é montado por URL em tempo de execução; o Vite copia o arquivo e devolve o endereço.
 */
let promise: Promise<typeof import('maplibre-gl')> | null = null

export function loadMapLibre() {
  promise ??= Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl.css'),
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
  ]).then(([ml, , worker]) => {
    ml.setWorkerUrl(worker.default)
    return ml
  })
  return promise
}

/** Vetores da OpenFreeMap: gratuitos, sem chave, uso comercial liberado. */
export const OFM_SOURCE = { type: 'vector' as const, url: 'https://tiles.openfreemap.org/planet' }
export const OFM_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
export const OFM_ATTRIBUTION = 'OpenFreeMap © OpenMapTiles © OpenStreetMap'

const EARTH_R = 6371000
const toRad = (d: number) => (d * Math.PI) / 180

/** Ponto a `dist` metros de (lat, lon) no rumo `bearing` (aproximação local, ok para poucos km). */
export function offsetLngLat(lat: number, lon: number, bearing: number, dist: number): [number, number] {
  const dLat = (dist * Math.cos(toRad(bearing))) / EARTH_R
  const dLon = (dist * Math.sin(toRad(bearing))) / (EARTH_R * Math.cos(toRad(lat)))
  return [lon + (dLon * 180) / Math.PI, lat + (dLat * 180) / Math.PI]
}

type QueryableMap = {
  project(lngLat: [number, number]): { x: number; y: number }
  queryRenderedFeatures(point: [number, number], options: { layers: string[] }): unknown[]
}

/**
 * Leva o pico para a linha da costa: anda pela perpendicular à praia (rumo `facing`) a partir
 * da coordenada cadastrada até achar a fronteira terra/água da camada `waterLayer` já desenhada.
 * Devolve null se não achar (ex.: tiles ainda não carregados).
 */
export function snapToCoast(
  map: QueryableMap,
  spot: { lat: number; lon: number; facing: number },
  waterLayer = 'water',
): [number, number] | null {
  const isWater = (p: [number, number]) => {
    const px = map.project(p)
    return map.queryRenderedFeatures([px.x, px.y], { layers: [waterLayer] }).length > 0
  }
  const STEP = 20 // m
  const MAX = 3000 // m
  const start = isWater([spot.lon, spot.lat])
  // em terra: anda para o mar; na água: anda para a terra
  const bearing = start ? spot.facing + 180 : spot.facing
  let prev: [number, number] = [spot.lon, spot.lat]
  for (let d = STEP; d <= MAX; d += STEP) {
    const p = offsetLngLat(spot.lat, spot.lon, bearing, d)
    if (isWater(p) !== start) {
      // fronteira entre o último ponto e este: fica no meio, do lado da areia
      return [(prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2]
    }
    prev = p
  }
  return null
}
