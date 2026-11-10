/**
 * Camada de dados — Open-Meteo (https://open-meteo.com)
 *
 * - Marine API: altura/período/direção de ondulação (swell primário e secundário),
 *   mar de vento, temperatura da água e nível do mar (maré). Usa "best_match",
 *   que combina os modelos ECMWF WAM, Météo-France MFWAM e NOAA GFS-Wave.
 *   Previsão de 14 dias: depois do horizonte do best_match (~10 dias) as ondas vêm só do
 *   NOAA GFS-Wave (vai a 16 dias) e a maré é prolongada por análise harmônica (lib/tideHarmonic).
 * - Forecast API: vento a 10 m, rajadas, temperatura do ar, nascer/pôr do sol.
 *
 * Gratuita para uso não comercial, sem chave, com CORS liberado.
 * Para uso comercial use um plano pago e defina VITE_OPEN_METEO_API_KEY.
 */

// Código compartilhado entre o site (Vite) e as Edge Functions (Deno): sem import.meta.env nem DOM.
import { extendTide } from './tideHarmonic.ts'

export const marineUrl = (apiKey?: string) =>
  apiKey ? 'https://customer-marine-api.open-meteo.com/v1/marine' : 'https://marine-api.open-meteo.com/v1/marine'
export const weatherUrl = (apiKey?: string) =>
  apiKey ? 'https://customer-api.open-meteo.com/v1/forecast' : 'https://api.open-meteo.com/v1/forecast'

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
  'wind_wave_direction',
  'wind_wave_period',
  'sea_surface_temperature',
] as const

/** dias de previsão */
export const FORECAST_DAYS = 14
/** dias passados de nível do mar usados no ajuste harmônico da maré */
const TIDE_PAST_DAYS = 30
/** modelo de onda de longo prazo, usado depois do horizonte do best_match */
const LONG_MODEL = 'ncep_gfswave025'

const WEATHER_HOURLY = [
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'precipitation',
  'cloud_cover',
  'uv_index',
] as const

const WEATHER_DAILY = [
  'sunrise',
  'sunset',
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'precipitation_sum',
  'uv_index_max',
  'wind_speed_10m_max',
] as const

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
  windWaveDirection: number | null
  windWavePeriod: number | null
  waterTemp: number | null
  seaLevel: number | null
  windSpeed: number | null
  windDirection: number | null
  windGusts: number | null
  airTemp: number | null
  weatherCode: number | null
  rainChance: number | null
  rain: number | null
  cloudCover: number | null
  uv: number | null
  /** além do horizonte do best_match: onda só do GFS-Wave (tendência) */
  longRange: boolean
  /** nível do mar prolongado pela análise harmônica */
  tideModeled: boolean
}

export type DayWeather = {
  date: string
  sunrise: string
  sunset: string
  weatherCode: number | null
  tMax: number | null
  tMin: number | null
  rainChance: number | null
  rainSum: number | null
  uvMax: number | null
  windMax: number | null
}

export type Forecast = { hours: HourPoint[]; sun: DayWeather[]; fetchedAt: number }

type Hourly = Record<string, (number | null)[]> & { time: string[] }

function buildUrl(base: string, params: Record<string, string | number>, apiKey?: string) {
  const url = new URL(base)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  if (apiKey) url.searchParams.set('apikey', apiKey)
  return url.toString()
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (e) {
    if (signal?.aborted) throw e
    // sem conexão, bloqueio de rede ou limite de uso (respostas 429 chegam sem CORS)
    throw new Error('Não foi possível carregar a previsão agora. Verifique sua conexão e tente de novo em instantes.')
  }
  if (res.status === 429) throw new Error('Muitas consultas à previsão no momento. Tente de novo em alguns minutos.')
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

/** Busca e monta a previsão de 14 dias de um ponto (sem cache: quem chama decide). */
export function fetchForecastRaw(lat: number, lon: number, opts: { apiKey?: string; signal?: AbortSignal } = {}): Promise<Forecast> {
  const { apiKey, signal } = opts

  const common = { latitude: lat, longitude: lon, timezone: 'America/Sao_Paulo', forecast_days: FORECAST_DAYS }
  const marineReq = buildUrl(marineUrl(apiKey), {
    ...common,
    hourly: MARINE_HOURLY.join(','),
    cell_selection: 'sea',
    models: `best_match,${LONG_MODEL}`,
  })
  const tideReq = buildUrl(marineUrl(apiKey), {
    ...common,
    hourly: 'sea_level_height_msl',
    cell_selection: 'sea',
    past_days: TIDE_PAST_DAYS,
  })
  const weatherReq = buildUrl(weatherUrl(apiKey), {
    ...common,
    hourly: WEATHER_HOURLY.join(','),
    daily: WEATHER_DAILY.join(','),
    wind_speed_unit: 'kmh',
  })

  return Promise.all([
    getJson<{ hourly: Hourly }>(marineReq, signal),
    getJson<{ hourly: Hourly; daily: Record<string, (number | string | null)[]> & { time: string[] } }>(
      weatherReq,
      signal,
    ),
    getJson<{ hourly: Hourly }>(tideReq, signal),
  ]).then(([marine, weather, tideRes]) => {
    const m = marine.hourly
    // maré: modelo até onde existe, harmônica depois
    const tt = tideRes.hourly
    const tide = extendTide(tt.time, tt.sea_level_height_msl ?? [])
    const tideAt = new Map(tt.time.map((t, i) => [t, tide[i]]))
    const w = weather.hourly
    const wIndex = new Map(w.time.map((t, i) => [t, i]))
    const hours: HourPoint[] = m.time.map((time, i) => {
      const j = wIndex.get(time)
      const wv = (k: string) => (j === undefined ? null : (w[k]?.[j] ?? null))
      // best_match primeiro; depois do horizonte dele, o modelo de longo prazo
      const best = (k: string) => m[`${k}_marine_best_match`]?.[i] ?? m[`${k}_best_match`]?.[i] ?? m[k]?.[i] ?? null
      const mv = (k: string) => best(k) ?? m[`${k}_${LONG_MODEL}`]?.[i] ?? null
      const td = tideAt.get(time)
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
        windWaveDirection: mv('wind_wave_direction'),
        windWavePeriod: mv('wind_wave_period'),
        waterTemp: mv('sea_surface_temperature'),
        seaLevel: td?.level ?? null,
        windSpeed: wv('wind_speed_10m'),
        windDirection: wv('wind_direction_10m'),
        windGusts: wv('wind_gusts_10m'),
        airTemp: wv('temperature_2m'),
        weatherCode: wv('weather_code'),
        rainChance: wv('precipitation_probability'),
        rain: wv('precipitation'),
        cloudCover: wv('cloud_cover'),
        uv: wv('uv_index'),
        longRange: best('wave_height') == null,
        tideModeled: !!td?.modeled,
      }
    })
    const d = weather.daily
    const num = (k: string, i: number) => (d[k]?.[i] ?? null) as number | null
    const sun: DayWeather[] = d.time.map((date, i) => ({
      date,
      sunrise: String(d.sunrise?.[i] ?? ''),
      sunset: String(d.sunset?.[i] ?? ''),
      weatherCode: num('weather_code', i),
      tMax: num('temperature_2m_max', i),
      tMin: num('temperature_2m_min', i),
      rainChance: num('precipitation_probability_max', i),
      rainSum: num('precipitation_sum', i),
      uvMax: num('uv_index_max', i),
      windMax: num('wind_speed_10m_max', i),
    }))
    return { hours, sun, fetchedAt: Date.now() }
  })
}
