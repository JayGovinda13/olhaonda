export type Spot = {
  id: string
  name: string
  city: string
  state: string
  lat: number
  lon: number
  /** Direção (graus) para onde a praia está voltada, ou seja, de onde vem o swell "de frente". */
  facing: number
  kind: 'beach' | 'reef' | 'point'
}

/**
 * Picos do litoral brasileiro, do Sul ao Nordeste.
 * Coordenadas e orientação aproximadas; ajuste conforme o conhecimento local.
 */
export const SPOTS: Spot[] = [
  { id: 'torres', name: 'Praia da Cal', city: 'Torres', state: 'RS', lat: -29.344, lon: -49.722, facing: 110, kind: 'beach' },
  { id: 'silveira', name: 'Silveira', city: 'Garopaba', state: 'SC', lat: -28.033, lon: -48.616, facing: 110, kind: 'point' },
  { id: 'imbituba', name: 'Praia da Vila', city: 'Imbituba', state: 'SC', lat: -28.236, lon: -48.656, facing: 130, kind: 'beach' },
  { id: 'guarda', name: 'Guarda do Embaú', city: 'Palhoça', state: 'SC', lat: -27.905, lon: -48.588, facing: 100, kind: 'beach' },
  { id: 'joaquina', name: 'Joaquina', city: 'Florianópolis', state: 'SC', lat: -27.629, lon: -48.448, facing: 100, kind: 'beach' },
  { id: 'mole', name: 'Praia Mole', city: 'Florianópolis', state: 'SC', lat: -27.603, lon: -48.432, facing: 90, kind: 'beach' },
  { id: 'matinhos', name: 'Matinhos', city: 'Matinhos', state: 'PR', lat: -25.82, lon: -48.53, facing: 110, kind: 'beach' },
  { id: 'pitangueiras', name: 'Pitangueiras', city: 'Guarujá', state: 'SP', lat: -24.0, lon: -46.26, facing: 170, kind: 'beach' },
  { id: 'maresias', name: 'Maresias', city: 'São Sebastião', state: 'SP', lat: -23.79, lon: -45.56, facing: 170, kind: 'beach' },
  { id: 'juquehy', name: 'Juquehy', city: 'São Sebastião', state: 'SP', lat: -23.77, lon: -45.73, facing: 165, kind: 'beach' },
  { id: 'itamambuca', name: 'Itamambuca', city: 'Ubatuba', state: 'SP', lat: -23.4, lon: -45.01, facing: 140, kind: 'beach' },
  { id: 'prainha', name: 'Prainha', city: 'Rio de Janeiro', state: 'RJ', lat: -23.04, lon: -43.506, facing: 170, kind: 'beach' },
  { id: 'barra', name: 'Barra da Tijuca', city: 'Rio de Janeiro', state: 'RJ', lat: -23.012, lon: -43.36, facing: 175, kind: 'beach' },
  { id: 'arpoador', name: 'Arpoador', city: 'Rio de Janeiro', state: 'RJ', lat: -22.989, lon: -43.19, facing: 180, kind: 'point' },
  { id: 'itauna', name: 'Itaúna', city: 'Saquarema', state: 'RJ', lat: -22.937, lon: -42.48, facing: 170, kind: 'beach' },
  { id: 'geriba', name: 'Geribá', city: 'Búzios', state: 'RJ', lat: -22.78, lon: -41.91, facing: 170, kind: 'beach' },
  { id: 'jacaraipe', name: 'Jacaraípe', city: 'Serra', state: 'ES', lat: -20.15, lon: -40.18, facing: 90, kind: 'beach' },
  { id: 'itacare', name: 'Tiririca', city: 'Itacaré', state: 'BA', lat: -14.29, lon: -38.99, facing: 90, kind: 'beach' },
  { id: 'stellamaris', name: 'Stella Maris', city: 'Salvador', state: 'BA', lat: -12.94, lon: -38.33, facing: 130, kind: 'reef' },
  { id: 'frances', name: 'Praia do Francês', city: 'Marechal Deodoro', state: 'AL', lat: -9.77, lon: -35.84, facing: 130, kind: 'reef' },
  { id: 'maracaipe', name: 'Maracaípe', city: 'Ipojuca', state: 'PE', lat: -8.53, lon: -34.995, facing: 110, kind: 'reef' },
  { id: 'pipa', name: 'Praia do Amor', city: 'Pipa', state: 'RN', lat: -6.23, lon: -35.04, facing: 90, kind: 'reef' },
  { id: 'paracuru', name: 'Paracuru', city: 'Paracuru', state: 'CE', lat: -3.4, lon: -39.03, facing: 0, kind: 'reef' },
  { id: 'jeri', name: 'Jericoacoara', city: 'Jijoca', state: 'CE', lat: -2.79, lon: -40.51, facing: 350, kind: 'point' },
  { id: 'cacimba', name: 'Cacimba do Padre', city: 'Fernando de Noronha', state: 'PE', lat: -3.85, lon: -32.44, facing: 330, kind: 'beach' },
]

export const DEFAULT_SPOT_ID = 'itauna'

export const KIND_LABEL: Record<Spot['kind'], string> = {
  beach: 'Beach break',
  reef: 'Fundo de pedra/coral',
  point: 'Point break',
}

/** Distância em km (haversine). */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function nearestSpot(lat: number, lon: number) {
  return SPOTS.reduce((best, s) =>
    distanceKm(lat, lon, s.lat, s.lon) < distanceKm(lat, lon, best.lat, best.lon) ? s : best,
  )
}
