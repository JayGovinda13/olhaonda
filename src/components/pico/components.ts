import { brand } from '../../theme'

/** Componentes do mar mostradas na visão espectral, com a cor do contorno de cada uma. */
export const COMPONENTS = [
  { key: 'vagas', label: 'Mar de vento', stroke: brand.green },
  { key: 'swell1', label: 'Swell 1', stroke: brand.plum },
  { key: 'swell2', label: 'Swell 2', stroke: brand.purple },
] as const
