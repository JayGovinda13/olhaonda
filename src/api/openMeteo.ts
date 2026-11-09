/**
 * Camada de dados — Open-Meteo (https://open-meteo.com)
 *
 * - Marine API: altura/período/direção de ondulação (swell primário e secundário),
 *   mar de vento, temperatura da água e nível do mar (maré). Usa "best_match",
 *   que combina os modelos ECMWF WAM, Météo-France MFWAM e NOAA GFS-Wave.
 * - Forecast API: vento a 10 m, rajadas, temperatura do ar, nascer/pôr do sol.
 *
 * Gratuita para uso não comercial, sem chave, com CORS liberado.
 * Para uso comercial use um plano pago e defina VITE_OPEN_METEO_API_KEY.
 */

const API_KEY = import.meta.env.VITE_OPEN_METEO_API_KEY as string | undefined
const MARINE_URL = API_KEY
  ? 'https://customer-marine-api.open-meteo.com/v1/marine'
  : 'https://marine-api.open-meteo.com/v1/marine'
const WEATHER_URL = API_KEY
  ? 'https://customer-api.open-meteo.com/v1/forecast'
  : 'https://api.open-meteo.com/v1/forecast'

const MARINE_HOURLY = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'swell_wave_height',
  'swell_wave_direction',
  'swell_wave_period',
  'swell_wave_peak_period',
  'secondary_swell_wave_height',
  'secondary_swell_wave_direction',
  'secondary_swell_wave_period',
  'wind_wave_height',
  'sea_surface_temperature',
  'sea_level_height_msl',
] as const

const WEATHER_HOURLY = ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'temperature_2m'] as const

export type HourPoint = {
  time: string // ISO local (America/Sao_Paulo)
  waveHeight: number | null
  waveDirection: number | null
  wavePeriod: number | null
  swellHeight: number | null
  swellDirection: number | null
  swellPeriod: number | null
  swellPeakPeriod: number | null
  swell2Height: number | null
  swell2Direction: number | null
  swell2Period: number | null
  windWaveHeight: number | null
  waterTemp: number | null
  seaLevel: number | null
  windSpeed: number | null
  windDirection: number | null
  windGusts: number | null
  airTemp: number | null
}

export type DaySun = { date: string; sunrise: string; sunset: string }

export type Forecast = { hours: HourPoint[]; sun: DaySun[]; fetchedAt: number }

type Hourly = Record<string, (number | null)[]> & { time: string[] }

function buildUrl(base: string, params: Record<string, string | number>) {
  const url = new URL(base)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  if (API_KEY) url.searchParams.set('apikey', API_KEY)
  return url.toString()
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) {
    let reason = `${res.status}`
    try {
      const body = (await res.json()) as { reason?: string }
      if (body.reason) reason = body.reason
    } catch {
      /* corpo não é JSON */
    }
    throw new Error(`Falha ao consultar a previsão (${reason})`)
  }
  return (await res.json()) as T
}

const cache = new Map<string, Promise<Forecast>>()
const TTL = 30 * 60 * 1000

export function fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
  const hit = cache.get(key)
  if (hit) return hit

  const common = { latitude: lat, longitude: lon, timezone: 'America/Sao_Paulo', forecast_days: 7 }
  const marineUrl = buildUrl(MARINE_URL, {
    ...common,
    hourly: MARINE_HOURLY.join(','),
    cell_selection: 'sea',
  })
  const weatherUrl = buildUrl(WEATHER_URL, {
    ...common,
    hourly: WEATHER_HOURLY.join(','),
    daily: 'sunrise,sunset',
    wind_speed_unit: 'kmh',
  })

  const p = Promise.all([
    getJson<{ hourly: Hourly }>(marineUrl, signal),
    getJson<{ hourly: Hourly; daily: { time: string[]; sunrise: string[]; sunset: string[] } }>(
      weatherUrl,
      signal,
    ),
  ]).then(([marine, weather]) => {
    const m = marine.hourly
    const w = weather.hourly
    const wIndex = new Map(w.time.map((t, i) => [t, i]))
    const hours: HourPoint[] = m.time.map((time, i) => {
      const j = wIndex.get(time)
      const wv = (k: string) => (j === undefined ? null : (w[k]?.[j] ?? null))
      const mv = (k: string) => m[k]?.[i] ?? null
      return {
        time,
        waveHeight: mv('wave_height'),
        waveDirection: mv('wave_direction'),
        wavePeriod: mv('wave_period'),
        swellHeight: mv('swell_wave_height'),
        swellDirection: mv('swell_wave_direction'),
        swellPeriod: mv('swell_wave_period'),
        swellPeakPeriod: mv('swell_wave_peak_period'),
        swell2Height: mv('secondary_swell_wave_height'),
        swell2Direction: mv('secondary_swell_wave_direction'),
        swell2Period: mv('secondary_swell_wave_period'),
        windWaveHeight: mv('wind_wave_height'),
        waterTemp: mv('sea_surface_temperature'),
        seaLevel: mv('sea_level_height_msl'),
        windSpeed: wv('wind_speed_10m'),
        windDirection: wv('wind_direction_10m'),
        windGusts: wv('wind_gusts_10m'),
        airTemp: wv('temperature_2m'),
      }
    })
    const d = weather.daily
    const sun = d.time.map((date, i) => ({ date, sunrise: d.sunrise[i], sunset: d.sunset[i] }))
    return { hours, sun, fetchedAt: Date.now() }
  })

  cache.set(key, p)
  p.catch(() => cache.delete(key))
  setTimeout(() => cache.delete(key), TTL)
  return p
}
