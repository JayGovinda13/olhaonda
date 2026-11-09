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
  { id: 'gua-guaiuba', name: 'Guaiúba', ...G, lat: -24.01811, lon: -46.29233, facing: 233, kind: 'beach' },
  { id: 'gua-tombo', name: 'Praia do Tombo', ...G, lat: -24.01291, lon: -46.26979, facing: 173, kind: 'beach' },
  { id: 'gua-therock', name: 'The Rock', ...G, lat: -24.01305, lon: -46.26749, facing: 185, kind: 'reef' },
  { id: 'gua-asturias', name: 'Astúrias', ...G, lat: -24.00184, lon: -46.26391, facing: 140, kind: 'beach' },
  { id: 'gua-pitangueiras', name: 'Pitangueiras', ...G, lat: -23.99873, lon: -46.2566, facing: 148, kind: 'beach' },
  { id: 'gua-enseada', name: 'Enseada', ...G, lat: -23.98801, lon: -46.22994, facing: 170, kind: 'beach' },
  { id: 'gua-pernambuco', name: 'Pernambuco', ...G, lat: -23.96741, lon: -46.1856, facing: 90, kind: 'beach' },
  { id: 'gua-marcasado', name: 'Mar Casado', ...G, lat: -23.96286, lon: -46.18399, facing: 123, kind: 'beach' },
  { id: 'gua-sorocotuba', name: 'Sorocotuba', ...G, lat: -23.951, lon: -46.175, facing: 110, kind: 'beach', sheltered: true },
  { id: 'gua-eden', name: 'Praia do Éden', ...G, lat: -23.943, lon: -46.168, facing: 110, kind: 'beach', sheltered: true },
  { id: 'gua-iporanga', name: 'Iporanga', ...G, lat: -23.917, lon: -46.15, facing: 100, kind: 'beach' },
  { id: 'gua-saopedro', name: 'São Pedro', ...G, lat: -23.908, lon: -46.145, facing: 100, kind: 'beach' },
  { id: 'gua-pereque', name: 'Perequê', ...G, lat: -23.937, lon: -46.18, facing: 60, kind: 'beach', sheltered: true },
  { id: 'gua-branca', name: 'Praia Branca', ...G, lat: -23.87238, lon: -46.1385, facing: 123, kind: 'beach' },
  { id: 'gua-preta', name: 'Praia Preta', ...G, lat: -23.87215, lon: -46.13433, facing: 108, kind: 'beach' },
]

/**
 * Baixada Santista: praias com onda, de sudoeste (Peruíbe) para nordeste (Bertioga).
 * Coordenadas conferidas no OpenStreetMap (nov/2026): ponto na linha d'água em frente ao bairro/praia
 * de mesmo nome, e `facing` medido pelo desenho real da costa. Pendentes: Iporanga e São Pedro.
 */
const PERUIBE = bx('Peruíbe')
const ITANHAEM = bx('Itanhaém')
const MONGAGUA = bx('Mongaguá')
const PG = bx('Praia Grande')
const SV = bx('São Vicente')
const SANTOS = bx('Santos')
const BERTIOGA = bx('Bertioga')

const BAIXADA_SUL: Spot[] = [
  { id: 'per-guarau', name: 'Guaraú', ...PERUIBE, lat: -24.36969, lon: -47.01174, facing: 123, kind: 'beach' },
  { id: 'per-centro', name: 'Peruíbe (Centro)', ...PERUIBE, lat: -24.32431, lon: -46.99382, facing: 133, kind: 'beach' },
  { id: 'ita-cibratel', name: 'Cibratel', ...ITANHAEM, lat: -24.21523, lon: -46.83964, facing: 145, kind: 'beach' },
  { id: 'ita-sonhos', name: 'Praia dos Sonhos', ...ITANHAEM, lat: -24.1912, lon: -46.79254, facing: 131, kind: 'beach' },
  { id: 'ita-suarao', name: 'Praião (Suarão)', ...ITANHAEM, lat: -24.16681, lon: -46.74959, facing: 150, kind: 'beach' },
  { id: 'mon-agenor', name: 'Agenor de Campos', ...MONGAGUA, lat: -24.13201, lon: -46.68809, facing: 148, kind: 'beach' },
  { id: 'mon-centro', name: 'Mongaguá (Plataforma)', ...MONGAGUA, lat: -24.09782, lon: -46.62199, facing: 153, kind: 'beach' },
  { id: 'pg-solemar', name: 'Solemar', ...PG, lat: -24.07991, lon: -46.58556, facing: 150, kind: 'beach' },
  { id: 'pg-caicara', name: 'Vila Caiçara', ...PG, lat: -24.05176, lon: -46.52507, facing: 155, kind: 'beach' },
  { id: 'pg-ocian', name: 'Ocian', ...PG, lat: -24.03054, lon: -46.47406, facing: 160, kind: 'beach' },
  { id: 'pg-guilhermina', name: 'Guilhermina', ...PG, lat: -24.01596, lon: -46.42592, facing: 170, kind: 'beach' },
  { id: 'pg-boqueirao', name: 'Boqueirão', ...PG, lat: -24.01487, lon: -46.41443, facing: 180, kind: 'beach' },
  { id: 'pg-cantodoforte', name: 'Canto do Forte', ...PG, lat: -24.01621, lon: -46.40514, facing: 197, kind: 'beach' },
  { id: 'sv-itarare', name: 'Itararé', ...SV, lat: -23.97133, lon: -46.36122, facing: 163, kind: 'beach' },
  { id: 'san-josemenino', name: 'José Menino (Quebra-Mar)', ...SANTOS, lat: -23.97039, lon: -46.34932, facing: 170, kind: 'beach' },
  { id: 'san-pompeia', name: 'Pompéia', ...SANTOS, lat: -23.97061, lon: -46.34183, facing: 185, kind: 'beach' },
]

const BAIXADA_NORTE: Spot[] = [
  { id: 'ber-enseada', name: 'Enseada de Bertioga', ...BERTIOGA, lat: -23.82718, lon: -46.10173, facing: 155, kind: 'beach' },
  { id: 'ber-riviera', name: 'Riviera de São Lourenço', ...BERTIOGA, lat: -23.80338, lon: -46.02007, facing: 158, kind: 'beach' },
  { id: 'ber-itaguare', name: 'Itaguaré', ...BERTIOGA, lat: -23.78944, lon: -45.98531, facing: 155, kind: 'beach' },
  { id: 'ber-guaratuba', name: 'Guaratuba', ...BERTIOGA, lat: -23.77641, lon: -45.94927, facing: 165, kind: 'beach' },
  { id: 'ber-boraceia', name: 'Boracéia', ...BERTIOGA, lat: -23.75867, lon: -45.85189, facing: 173, kind: 'beach' },
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
