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
  getZoom?(): number
}

/**
 * Leva o pico para a linha da costa: anda pela perpendicular à praia (rumo `facing`) a partir
 * da coordenada cadastrada até achar a fronteira terra/oceano da camada `waterLayer` (só oceano).
 * Devolve null se não achar (ex.: tiles ainda não carregados).
 */
export function snapToCoast(
  map: QueryableMap,
  spot: { lat: number; lon: number; facing: number },
  waterLayer = 'ocean-query',
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

/** Seta (apontando para o norte) desenhada em canvas, usada como ícone SDF para poder colorir. */
export function arrowImage() {
  const S = 64
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.beginPath()
  g.moveTo(S / 2, 4) // ponta
  g.lineTo(S - 12, 30)
  g.lineTo(S / 2 + 7, 26)
  g.lineTo(S / 2 + 7, S - 6)
  g.lineTo(S / 2 - 7, S - 6)
  g.lineTo(S / 2 - 7, 26)
  g.lineTo(12, 30)
  g.closePath()
  g.fill()
  return g.getImageData(0, 0, S, S)
}


/**
 * Zoom em que a posição do pico na costa é calculada. Precisa ser o mesmo nos dois mapas
 * (card verde e "O pico"): em zoom mais afastado o contorno da costa é simplificado e o pino
 * cairia em outro lugar.
 */
export const SNAP_ZOOM = 13.2

/** posição na costa já calculada, por pico (os dois mapas mostram exatamente o mesmo ponto) */
const coastCache = new Map<string, [number, number]>()

export function cachedCoast(id: string) {
  return coastCache.get(id) ?? null
}

/** Calcula (no zoom padrão) e guarda a posição do pico na costa. O mapa precisa estar em SNAP_ZOOM e ocioso. */
export function rememberCoast(map: QueryableMap, spot: { id: string; lat: number; lon: number; facing: number }) {
  const hit = coastCache.get(spot.id)
  if (hit) return hit
  const c = snapToCoast(map, spot) ?? ([spot.lon, spot.lat] as [number, number])
  // só guarda se foi calculado no zoom padrão (a pessoa pode ter dado zoom no mapa do "O pico")
  if (!map.getZoom || Math.abs(map.getZoom() - SNAP_ZOOM) < 0.1) coastCache.set(spot.id, c)
  return c
}
