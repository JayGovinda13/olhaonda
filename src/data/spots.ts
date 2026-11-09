import { SPOT_SCOPE } from '../config/env'

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
  /** Grupo no seletor de picos (padrão: o estado). */
  region?: string
  /** Referência para achar o pico. */
  note?: string
  /** Praia abrigada: só quebra com swell grande ou de direção específica. */
  sheltered?: boolean
  /** Faz parte da Baixada Santista (lista de produção). */
  baixada?: boolean
  /** Porto de referência da maré (id em tidePorts.ts); padrão: o mais próximo. */
  tidePort?: string
}

/** Cidade da Baixada Santista: o grupo no seletor é só o nome da cidade; maré pelo Porto de Santos. */
const bx = (city: string) => ({ city, state: 'SP', region: city, baixada: true, tidePort: 'santos' }) as const

const G = bx('Guarujá')

/**
 * Todas as praias do Guarujá (e o The Rock, fundo de pedra), de oeste (canal de Santos) para leste (canal de Bertioga).
 * As do canal e as enseadas fechadas estão marcadas como abrigadas.
 */
const GUARUJA: Spot[] = [
  { id: 'gua-goes', name: 'Praia do Góes', ...G, lat: -23.998, lon: -46.334, facing: 300, kind: 'beach', sheltered: true },
  { id: 'gua-santacruz', name: 'Santa Cruz dos Navegantes', ...G, lat: -23.992, lon: -46.307, facing: 330, kind: 'beach', sheltered: true },
  { id: 'gua-cheiralimao', name: 'Cheira Limão', ...G, lat: -24.001, lon: -46.318, facing: 290, kind: 'beach', sheltered: true },
  { id: 'gua-sangava', name: 'Sangava', ...G, lat: -24.012, lon: -46.321, facing: 220, kind: 'beach', sheltered: true },
  { id: 'gua-monduba', name: 'Monduba', ...G, lat: -24.009, lon: -46.296, facing: 200, kind: 'beach', sheltered: true },
  { id: 'gua-guaiuba', name: 'Guaiúba', ...G, lat: -24.011, lon: -46.277, facing: 180, kind: 'beach' },
  { id: 'gua-tombo', name: 'Praia do Tombo', ...G, lat: -24.011, lon: -46.271, facing: 165, kind: 'beach' },
  { id: 'gua-therock', name: 'The Rock', ...G, lat: -24.01238, lon: -46.26743, facing: 160, kind: 'reef' },
  { id: 'gua-asturias', name: 'Astúrias', ...G, lat: -24.001, lon: -46.265, facing: 150, kind: 'beach' },
  { id: 'gua-pitangueiras', name: 'Pitangueiras', ...G, lat: -23.997, lon: -46.257, facing: 150, kind: 'beach' },
  { id: 'gua-enseada', name: 'Enseada', ...G, lat: -23.991, lon: -46.225, facing: 160, kind: 'beach' },
  { id: 'gua-pernambuco', name: 'Pernambuco', ...G, lat: -23.968, lon: -46.193, facing: 140, kind: 'beach' },
  { id: 'gua-marcasado', name: 'Mar Casado', ...G, lat: -23.962, lon: -46.186, facing: 130, kind: 'beach' },
  { id: 'gua-sorocotuba', name: 'Sorocotuba', ...G, lat: -23.951, lon: -46.175, facing: 110, kind: 'beach', sheltered: true },
  { id: 'gua-eden', name: 'Praia do Éden', ...G, lat: -23.943, lon: -46.168, facing: 110, kind: 'beach', sheltered: true },
  { id: 'gua-iporanga', name: 'Iporanga', ...G, lat: -23.917, lon: -46.15, facing: 100, kind: 'beach' },
  { id: 'gua-saopedro', name: 'São Pedro', ...G, lat: -23.908, lon: -46.145, facing: 100, kind: 'beach' },
  { id: 'gua-pereque', name: 'Perequê', ...G, lat: -23.937, lon: -46.18, facing: 60, kind: 'beach', sheltered: true },
  { id: 'gua-branca', name: 'Praia Branca', ...G, lat: -23.87, lon: -46.14, facing: 120, kind: 'beach' },
  { id: 'gua-preta', name: 'Praia Preta', ...G, lat: -23.873, lon: -46.133, facing: 100, kind: 'beach' },
]

/**
 * Baixada Santista: praias com onda, de sudoeste (Peruíbe) para nordeste (Bertioga).
 * Coordenadas e orientação aproximadas: confira com quem surfa lá.
 */
const PERUIBE = bx('Peruíbe')
const ITANHAEM = bx('Itanhaém')
const MONGAGUA = bx('Mongaguá')
const PG = bx('Praia Grande')
const SV = bx('São Vicente')
const SANTOS = bx('Santos')
const BERTIOGA = bx('Bertioga')

const BAIXADA_SUL: Spot[] = [
  { id: 'per-guarau', name: 'Guaraú', ...PERUIBE, lat: -24.373, lon: -47.01, facing: 130, kind: 'beach' },
  { id: 'per-centro', name: 'Peruíbe (Centro)', ...PERUIBE, lat: -24.32, lon: -46.995, facing: 140, kind: 'beach' },
  { id: 'ita-cibratel', name: 'Cibratel', ...ITANHAEM, lat: -24.215, lon: -46.84, facing: 145, kind: 'beach' },
  { id: 'ita-sonhos', name: 'Praia dos Sonhos', ...ITANHAEM, lat: -24.188, lon: -46.795, facing: 145, kind: 'beach' },
  { id: 'ita-suarao', name: 'Praião (Suarão)', ...ITANHAEM, lat: -24.165, lon: -46.76, facing: 145, kind: 'beach' },
  { id: 'mon-agenor', name: 'Agenor de Campos', ...MONGAGUA, lat: -24.118, lon: -46.66, facing: 145, kind: 'beach' },
  { id: 'mon-centro', name: 'Mongaguá (Plataforma)', ...MONGAGUA, lat: -24.095, lon: -46.62, facing: 145, kind: 'beach' },
  { id: 'pg-solemar', name: 'Solemar', ...PG, lat: -24.09, lon: -46.55, facing: 140, kind: 'beach' },
  { id: 'pg-caicara', name: 'Vila Caiçara', ...PG, lat: -24.065, lon: -46.5, facing: 140, kind: 'beach' },
  { id: 'pg-ocian', name: 'Ocian', ...PG, lat: -24.037, lon: -46.455, facing: 145, kind: 'beach' },
  { id: 'pg-guilhermina', name: 'Guilhermina', ...PG, lat: -24.025, lon: -46.432, facing: 145, kind: 'beach' },
  { id: 'pg-boqueirao', name: 'Boqueirão', ...PG, lat: -24.014, lon: -46.414, facing: 145, kind: 'beach' },
  { id: 'pg-cantodoforte', name: 'Canto do Forte', ...PG, lat: -24.006, lon: -46.403, facing: 150, kind: 'beach' },
  { id: 'sv-itarare', name: 'Itararé', ...SV, lat: -23.977, lon: -46.369, facing: 170, kind: 'beach' },
  { id: 'san-josemenino', name: 'José Menino (Quebra-Mar)', ...SANTOS, lat: -23.975, lon: -46.352, facing: 175, kind: 'beach' },
  { id: 'san-pompeia', name: 'Pompéia', ...SANTOS, lat: -23.972, lon: -46.343, facing: 180, kind: 'beach' },
]

const BAIXADA_NORTE: Spot[] = [
  { id: 'ber-enseada', name: 'Enseada de Bertioga', ...BERTIOGA, lat: -23.822, lon: -46.105, facing: 150, kind: 'beach' },
  { id: 'ber-riviera', name: 'Riviera de São Lourenço', ...BERTIOGA, lat: -23.798, lon: -46.025, facing: 155, kind: 'beach' },
  { id: 'ber-itaguare', name: 'Itaguaré', ...BERTIOGA, lat: -23.782, lon: -45.99, facing: 160, kind: 'beach' },
  { id: 'ber-guaratuba', name: 'Guaratuba', ...BERTIOGA, lat: -23.771, lon: -45.913, facing: 165, kind: 'beach' },
  { id: 'ber-boraceia', name: 'Boracéia', ...BERTIOGA, lat: -23.763, lon: -45.858, facing: 160, kind: 'beach' },
]

/**
 * Picos do litoral brasileiro, do Sul ao Nordeste.
 * Coordenadas e orientação aproximadas; ajuste conforme o conhecimento local.
 */
const ALL_SPOTS: Spot[] = [
  { id: 'torres', name: 'Praia da Cal', city: 'Torres', state: 'RS', lat: -29.344, lon: -49.722, facing: 110, kind: 'beach' },
  { id: 'silveira', name: 'Silveira', city: 'Garopaba', state: 'SC', lat: -28.033, lon: -48.616, facing: 110, kind: 'point' },
  { id: 'imbituba', name: 'Praia da Vila', city: 'Imbituba', state: 'SC', lat: -28.236, lon: -48.656, facing: 130, kind: 'beach' },
  { id: 'guarda', name: 'Guarda do Embaú', city: 'Palhoça', state: 'SC', lat: -27.905, lon: -48.588, facing: 100, kind: 'beach' },
  { id: 'joaquina', name: 'Joaquina', city: 'Florianópolis', state: 'SC', lat: -27.629, lon: -48.448, facing: 100, kind: 'beach' },
  { id: 'mole', name: 'Praia Mole', city: 'Florianópolis', state: 'SC', lat: -27.603, lon: -48.432, facing: 90, kind: 'beach' },
  { id: 'matinhos', name: 'Matinhos', city: 'Matinhos', state: 'PR', lat: -25.82, lon: -48.53, facing: 110, kind: 'beach' },
  ...BAIXADA_SUL,
  ...GUARUJA,
  ...BAIXADA_NORTE,
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
  { id: 'cacimba', name: 'Cacimba do Padre', city: 'Fernando de Noronha', state: 'PE', region: 'PE · Fernando de Noronha', lat: -3.85, lon: -32.44, facing: 330, kind: 'beach' },
]

/**
 * Picos visíveis neste ambiente. Em produção (VITE_SPOT_SCOPE=baixada): só a Baixada Santista,
 * sem as praias abrigadas. Em staging/dev: todos.
 */
export const SPOTS: Spot[] =
  SPOT_SCOPE === 'baixada' ? ALL_SPOTS.filter((s) => s.baixada && !s.sheltered) : ALL_SPOTS

export const DEFAULT_SPOT_ID = SPOT_SCOPE === 'baixada' ? 'gua-pitangueiras' : 'itauna'

export const KIND_LABEL: Record<Spot['kind'], string> = {
  beach: 'Beach break',
  reef: 'Fundo de pedra',
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
