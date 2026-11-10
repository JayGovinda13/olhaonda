export * from '../../supabase/functions/_shared/core/surf.ts'

import { alpha, brand } from '../theme'

/** Cor da nota (0–5) que acompanha o modo claro/noturno (sobrepõe a do núcleo compartilhado). */
export function ratingColor(score: number) {
  if (score < 1) return alpha(brand.purple, 0.22)
  if (score < 2) return alpha(brand.plum, 0.55)
  if (score < 3) return brand.plum
  if (score < 4) return brand.green
  return brand.deepGreen
}
