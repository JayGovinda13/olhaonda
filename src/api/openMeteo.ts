/**
 * Previsão no site: busca em supabase/functions/_shared/core/openMeteo.ts (a mesma usada pelo
 * resumo diário do fórum e pelos alertas) com cache de 30 min por ponto.
 */
import { fetchForecastRaw, type Forecast } from '../../supabase/functions/_shared/core/openMeteo.ts'

export * from '../../supabase/functions/_shared/core/openMeteo.ts'

const API_KEY = (import.meta.env.VITE_OPEN_METEO_API_KEY as string | undefined) || undefined

const cache = new Map<string, Promise<Forecast>>()
const TTL = 30 * 60 * 1000

export function fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
  const hit = cache.get(key)
  if (hit) return hit
  const p = fetchForecastRaw(lat, lon, { apiKey: API_KEY, signal })
  cache.set(key, p)
  p.catch(() => cache.delete(key))
  setTimeout(() => cache.delete(key), TTL)
  return p
}
