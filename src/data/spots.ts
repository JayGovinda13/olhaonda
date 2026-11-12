/** Picos: dados em supabase/functions/_shared/core/spots.ts (compartilhados com as Edge Functions). */
import { SPOT_SCOPE } from '../config/env'
import { distanceKm, spotsForScope, type Spot } from '../../supabase/functions/_shared/core/spots.ts'

export * from '../../supabase/functions/_shared/core/spots.ts'

/**
 * Picos visíveis neste ambiente. Em produção: os estados de PROD_STATES (SC, SP, RJ, ES, AL, CE e AP), só praias com
 * onda. Em staging/dev: todos.
 */
export const SPOTS: Spot[] = spotsForScope(SPOT_SCOPE)

export const DEFAULT_SPOT_ID = SPOT_SCOPE === 'prod' ? 'gua-pit-ilha' : 'sqr-itauna'

export function nearestSpot(lat: number, lon: number) {
  return SPOTS.reduce((best, s) =>
    distanceKm(lat, lon, s.lat, s.lon) < distanceKm(lat, lon, best.lat, best.lon) ? s : best,
  )
}

/** Rótulo do grupo no seletor de picos: cidade e estado (ex.: "Garopaba · SC"). */
export const spotGroup = (s: Spot) => (s.region && !s.region.includes('·') ? `${s.region} · ${s.state}` : (s.region ?? s.state))
