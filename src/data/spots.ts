/** Picos: dados em supabase/functions/_shared/core/spots.ts (compartilhados com as Edge Functions). */
import { SPOT_SCOPE } from '../config/env'
import { distanceKm, spotsForScope, type Spot } from '../../supabase/functions/_shared/core/spots.ts'

export * from '../../supabase/functions/_shared/core/spots.ts'

/**
 * Picos visíveis neste ambiente. Em produção: o litoral de São Paulo com onda (sem as praias
 * abrigadas). Em staging/dev: todos.
 */
export const SPOTS: Spot[] = spotsForScope(SPOT_SCOPE)

export const DEFAULT_SPOT_ID = SPOT_SCOPE === 'sp' ? 'gua-pit-ilha' : 'itauna'

export function nearestSpot(lat: number, lon: number) {
  return SPOTS.reduce((best, s) =>
    distanceKm(lat, lon, s.lat, s.lon) < distanceKm(lat, lon, best.lat, best.lon) ? s : best,
  )
}
