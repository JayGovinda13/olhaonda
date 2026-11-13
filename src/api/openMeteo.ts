/**
 * Previsão no site: busca em supabase/functions/_shared/core/openMeteo.ts (a mesma usada pelo
 * resumo diário do fórum e pelos alertas) com cache de 30 min por ponto e, se a consulta falhar,
 * a última previsão guardada no aparelho (até 24 h) em vez de uma tela de erro.
 */
import { fetchForecastRaw, type Forecast } from '../../supabase/functions/_shared/core/openMeteo.ts'

export * from '../../supabase/functions/_shared/core/openMeteo.ts'

const API_KEY = (import.meta.env.VITE_OPEN_METEO_API_KEY as string | undefined) || undefined

const cache = new Map<string, Promise<Forecast>>()
const TTL = 30 * 60 * 1000
const STALE_MAX = 24 * 60 * 60 * 1000
const STORE_KEY = 'oo-forecasts'
const STORE_MAX = 6 // picos guardados no aparelho (cada previsão tem ~100 KB)

type Stored = Record<string, { savedAt: number; data: Forecast }>

function readStore(): Stored {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as Stored
  } catch {
    return {}
  }
}

function save(key: string, data: Forecast) {
  try {
    const all = readStore()
    all[key] = { savedAt: Date.now(), data }
    const keep = Object.entries(all)
      .sort((a, b) => b[1].savedAt - a[1].savedAt)
      .slice(0, STORE_MAX)
    localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(keep)))
  } catch {
    /* sem espaço ou armazenamento bloqueado: segue sem guardar */
  }
}

function stored(key: string): Forecast | null {
  const hit = readStore()[key]
  if (!hit || Date.now() - hit.savedAt > STALE_MAX) return null
  return { ...hit.data, stale: true }
}

export function fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
  const hit = cache.get(key)
  if (hit) return hit
  const p = fetchForecastRaw(lat, lon, { apiKey: API_KEY, signal })
    .then((data) => {
      save(key, data)
      return data
    })
    .catch((e: unknown) => {
      if (signal?.aborted) throw e
      const old = stored(key)
      if (old) return old
      throw e
    })
  cache.set(key, p)
  // previsão antiga não fica no cache em memória: a próxima visita tenta de novo
  p.then((d) => d.stale && cache.delete(key)).catch(() => cache.delete(key))
  setTimeout(() => cache.delete(key), TTL)
  return p
}
