/**
 * Campos em grade para os mapas do painel "O pico" (altura, período, vento, nuvens, chuva,
 * temperatura, CAPE e pressão). Uma única chamada multi-ponto por API (Open-Meteo aceita listas
 * de latitude/longitude). Pontos em terra voltam sem dados de onda, o que "recorta" o mar sozinho.
 *
 * Custo: cada ponto conta como uma chamada na cota da Open-Meteo. Por isso o resultado fica em
 * cache por 1 h (memória + sessionStorage). Em produção com muito tráfego, o ideal é gerar essa
 * grade no servidor (ex.: Cloudflare Worker com cron) e servir um JSON estático.
 */
import { MARINE_URL, WEATHER_URL } from './openMeteo'

export type Bbox = { west: number; south: number; east: number; north: number }

export const GRID_VARS = [
  'waveHeight',
  'wavePeriod',
  'waveDirection',
  'windSpeed',
  'windDirection',
  'cloudCover',
  'precipitation',
  'temperature',
  'cape',
  'pressure',
] as const
export type GridVar = (typeof GRID_VARS)[number]

export type Grid = {
  bbox: Bbox
  nx: number
  ny: number
  /** horários ISO locais (America/Sao_Paulo), iguais aos da previsão pontual */
  times: string[]
  /** values[var][t][j * nx + i]; j = linha a partir do NORTE, i = coluna a partir do OESTE */
  values: Record<GridVar, (number | null)[][]>
}

const API_KEY = import.meta.env.VITE_OPEN_METEO_API_KEY as string | undefined
const TTL = 60 * 60 * 1000
const mem = new Map<string, Promise<Grid>>()

function points(b: Bbox, nx: number, ny: number) {
  const lats: number[] = []
  const lons: number[] = []
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      lats.push(+(b.north - (j * (b.north - b.south)) / (ny - 1)).toFixed(3))
      lons.push(+(b.west + (i * (b.east - b.west)) / (nx - 1)).toFixed(3))
    }
  return { lats, lons }
}

type Loc = { hourly: Record<string, (number | null)[]> & { time: string[] } }

async function multi(base: string, lats: number[], lons: number[], hourly: string[], extra: Record<string, string> = {}) {
  const url = new URL(base)
  url.searchParams.set('latitude', lats.join(','))
  url.searchParams.set('longitude', lons.join(','))
  url.searchParams.set('hourly', hourly.join(','))
  url.searchParams.set('timezone', 'America/Sao_Paulo')
  url.searchParams.set('forecast_days', '7')
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v)
  if (API_KEY) url.searchParams.set('apikey', API_KEY)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapa indisponível (${res.status})`)
  const body = (await res.json()) as Loc | Loc[]
  return Array.isArray(body) ? body : [body]
}

async function load(b: Bbox, nx: number, ny: number): Promise<Grid> {
  const { lats, lons } = points(b, nx, ny)
  const [marine, weather] = await Promise.all([
    multi(MARINE_URL, lats, lons, ['wave_height', 'wave_period', 'wave_direction'], { cell_selection: 'nearest' }),
    multi(
      WEATHER_URL,
      lats,
      lons,
      ['wind_speed_10m', 'wind_direction_10m', 'cloud_cover', 'precipitation', 'temperature_2m', 'cape', 'pressure_msl'],
      { wind_speed_unit: 'kmh' },
    ),
  ])
  const times = weather[0].hourly.time
  const pick = (locs: Loc[], key: string) =>
    times.map((t, ti) => {
      return locs.map((l) => {
        // marinho e atmosférico podem ter horários iguais; usa o índice pelo horário por segurança
        const idx = l.hourly.time[ti] === t ? ti : l.hourly.time.indexOf(t)
        return idx < 0 ? null : (l.hourly[key]?.[idx] ?? null)
      })
    })
  return {
    bbox: b,
    nx,
    ny,
    times,
    values: {
      waveHeight: pick(marine, 'wave_height'),
      wavePeriod: pick(marine, 'wave_period'),
      waveDirection: pick(marine, 'wave_direction'),
      windSpeed: pick(weather, 'wind_speed_10m'),
      windDirection: pick(weather, 'wind_direction_10m'),
      cloudCover: pick(weather, 'cloud_cover'),
      precipitation: pick(weather, 'precipitation'),
      temperature: pick(weather, 'temperature_2m'),
      cape: pick(weather, 'cape'),
      pressure: pick(weather, 'pressure_msl'),
    },
  }
}

export function fetchGrid(b: Bbox, nx: number, ny: number): Promise<Grid> {
  const key = `olhaonda:grid:v1:${b.west},${b.south},${b.east},${b.north},${nx}x${ny}`
  const hit = mem.get(key)
  if (hit) return hit
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const { at, grid } = JSON.parse(raw) as { at: number; grid: Grid }
      if (Date.now() - at < TTL) {
        const p = Promise.resolve(grid)
        mem.set(key, p)
        return p
      }
    }
  } catch {
    /* sem storage */
  }
  const p = load(b, nx, ny)
  mem.set(key, p)
  p.then((grid) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), grid }))
    } catch {
      /* cota do storage */
    }
  }).catch(() => mem.delete(key))
  setTimeout(() => mem.delete(key), TTL)
  return p
}

/** Região do pico: caixa de ~3° x 4° centrada num ponto arredondado (picos vizinhos dividem o cache). */
export function regionFor(lat: number, lon: number): Bbox {
  const cLat = Math.round(lat * 2) / 2
  const cLon = Math.round(lon * 2) / 2
  return { west: cLon - 2, east: cLon + 2, north: cLat + 1.5, south: cLat - 1.5 }
}

/** Visão ampla: Brasil e Atlântico Sul. */
export const WIDE_BBOX: Bbox = { west: -76, east: -26, north: 6, south: -38 }
