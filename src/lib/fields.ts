import type { Grid, GridVar } from '../api/grid'

/** Abas do painel de mapas: o que pintar, com que escala e se mostra setas de direção. */
export type FieldId = 'altura' | 'periodo' | 'vento' | 'tempo' | 'ar' | 'cape' | 'pressao'

type Stop = [number, string]

export type FieldDef = {
  id: FieldId
  tab: string
  title: string
  unit: string
  value: GridVar
  /** campo de direção para as setas (de onde vem) */
  direction?: GridVar
  stops: Stop[]
  /** marcas da legenda */
  ticks: number[]
  /** formatação da marca */
  fmt?: (v: number) => string
}

export const FIELDS: FieldDef[] = [
  {
    id: 'altura',
    tab: 'Altura',
    title: 'Altura significativa das ondas (m)',
    unit: 'm',
    value: 'waveHeight',
    direction: 'waveDirection',
    stops: [
      [0, '#E6F4EE'],
      [0.5, '#A7DCC6'],
      [1, '#2FAE7B'],
      [1.5, '#178A62'],
      [2, '#0F4C3A'],
      [2.5, '#7A2E6E'],
      [3.5, '#4B1D5A'],
      [5, '#22091F'],
    ],
    ticks: [0, 0.5, 1, 1.5, 2, 2.5, 3.5, 5],
    fmt: (v) => v.toLocaleString('pt-BR'),
  },
  {
    id: 'periodo',
    tab: 'Período',
    title: 'Período médio das ondas (s)',
    unit: 's',
    value: 'wavePeriod',
    direction: 'waveDirection',
    stops: [
      [3, '#F5E6D3'],
      [6, '#CDE8C9'],
      [8, '#7DCBA5'],
      [10, '#2FAE7B'],
      [12, '#0F4C3A'],
      [14, '#7A2E6E'],
      [17, '#4B1D5A'],
    ],
    ticks: [3, 6, 8, 10, 12, 14, 17],
  },
  {
    id: 'vento',
    tab: 'Vento',
    title: 'Vento a 10 m (km/h)',
    unit: 'km/h',
    value: 'windSpeed',
    direction: 'windDirection',
    stops: [
      [0, '#EAF4F7'],
      [10, '#B8E0D2'],
      [20, '#6CC49F'],
      [30, '#F2D27A'],
      [40, '#E99A4C'],
      [55, '#C4473A'],
      [75, '#7A2E6E'],
    ],
    ticks: [0, 10, 20, 30, 40, 55, 75],
  },
  {
    id: 'tempo',
    tab: 'Tempo',
    title: 'Nuvens e chuva',
    unit: '%',
    value: 'cloudCover',
    // nuvens em cinza; a chuva é pintada por cima em azul (ver drawField)
    stops: [
      [0, '#8C9AA0'],
      [50, '#C9CFD1'],
      [100, '#FFFFFF'],
    ],
    ticks: [0, 50, 100],
    fmt: (v) => `${v}%`,
  },
  {
    id: 'ar',
    tab: 'Ar',
    title: 'Temperatura do ar (°C)',
    unit: '°C',
    value: 'temperature',
    stops: [
      [-5, '#3B4CC0'],
      [5, '#5DA9E9'],
      [12, '#7FD3B4'],
      [18, '#C9E77A'],
      [24, '#F6E35A'],
      [30, '#F2A33A'],
      [36, '#D9482B'],
      [42, '#8E1B3A'],
    ],
    ticks: [-5, 5, 12, 18, 24, 30, 36, 42],
  },
  {
    id: 'cape',
    tab: 'CAPE',
    title: 'CAPE: energia para tempestades (J/kg)',
    unit: 'J/kg',
    value: 'cape',
    stops: [
      [0, '#FFFFFF'],
      [100, '#FBF0C9'],
      [500, '#F6D27A'],
      [1000, '#EE9B45'],
      [2000, '#D2522F'],
      [3000, '#8E1B3A'],
      [4000, '#4B1D5A'],
    ],
    ticks: [0, 100, 500, 1000, 2000, 3000, 4000],
    fmt: (v) => (v >= 1000 ? `${v / 1000}k` : String(v)),
  },
  {
    id: 'pressao',
    tab: 'Pressão',
    title: 'Pressão ao nível do mar (hPa)',
    unit: 'hPa',
    value: 'pressure',
    stops: [
      [990, '#C4473A'],
      [1000, '#F2A33A'],
      [1008, '#F6E35A'],
      [1013, '#7FD3B4'],
      [1018, '#5DCBE0'],
      [1025, '#3E7FD1'],
      [1032, '#5B3FB8'],
      [1040, '#7A2E6E'],
    ],
    ticks: [990, 1000, 1008, 1013, 1018, 1025, 1032, 1040],
  },
]

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

export function colorAt(stops: Stop[], v: number): [number, number, number] {
  if (v <= stops[0][0]) return hex(stops[0][1]) as [number, number, number]
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [x0, c0] = stops[i - 1]
      const [x1, c1] = stops[i]
      const t = (v - x0) / (x1 - x0)
      const a = hex(c0)
      const b = hex(c1)
      return a.map((x, k) => Math.round(x + (b[k] - x) * t)) as [number, number, number]
    }
  }
  return hex(stops[stops.length - 1][1]) as [number, number, number]
}

/** Gradiente CSS vertical (valor alto em cima) para a legenda. */
export function legendGradient(def: FieldDef) {
  const lo = def.stops[0][0]
  const hi = def.stops[def.stops.length - 1][0]
  const parts = [...def.stops].reverse().map(([v, c]) => `${c} ${(((hi - v) / (hi - lo)) * 100).toFixed(1)}%`)
  return `linear-gradient(180deg, ${parts.join(', ')})`
}

/** Interpolação bilinear na grade; ignora vizinhos sem dado (terra para campos de onda). */
function sample(vals: (number | null)[], nx: number, ny: number, fx: number, fy: number) {
  const x0 = Math.max(0, Math.min(nx - 1, Math.floor(fx)))
  const y0 = Math.max(0, Math.min(ny - 1, Math.floor(fy)))
  const x1 = Math.min(nx - 1, x0 + 1)
  const y1 = Math.min(ny - 1, y0 + 1)
  const tx = fx - x0
  const ty = fy - y0
  const corners: [number | null, number][] = [
    [vals[y0 * nx + x0], (1 - tx) * (1 - ty)],
    [vals[y0 * nx + x1], tx * (1 - ty)],
    [vals[y1 * nx + x0], (1 - tx) * ty],
    [vals[y1 * nx + x1], tx * ty],
  ]
  let sum = 0
  let w = 0
  for (const [v, k] of corners) if (v != null) {
    sum += v * k
    w += k
  }
  return w > 0.05 ? { v: sum / w, w } : null
}

/** Desenha o campo da hora `t` num canvas (oeste→leste, norte→sul) e devolve um data URL. */
export function drawField(grid: Grid, def: FieldDef, t: number, size = 220): string {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d')!
  const img = g.createImageData(size, size)
  const vals = grid.values[def.value][t] ?? []
  const rain = def.id === 'tempo' ? (grid.values.precipitation[t] ?? []) : null
  for (let py = 0; py < size; py++) {
    const fy = (py / (size - 1)) * (grid.ny - 1)
    for (let px = 0; px < size; px++) {
      const fx = (px / (size - 1)) * (grid.nx - 1)
      const k = (py * size + px) * 4
      const sm = sample(vals, grid.nx, grid.ny, fx, fy)
      if (sm == null) {
        img.data[k + 3] = 0
        continue
      }
      let rgb = colorAt(def.stops, sm.v)
      if (rain) {
        const r = sample(rain, grid.nx, grid.ny, fx, fy)?.v ?? 0
        if (r >= 0.2) rgb = colorAt([[0.2, '#5DA9E9'], [2, '#2F6FD6'], [8, '#1B3FA0']], r) // chuva (mm/h)
      }
      img.data[k] = rgb[0]
      img.data[k + 1] = rgb[1]
      img.data[k + 2] = rgb[2]
      // borda suave onde a grade encontra a terra (campos de onda)
      img.data[k + 3] = Math.round(255 * Math.min(1, sm.w * 1.6))
    }
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL()
}

/** Pontos com setas de direção (uma por ponto da grade). */
export function directionPoints(grid: Grid, def: FieldDef, t: number) {
  if (!def.direction) return { type: 'FeatureCollection' as const, features: [] }
  const dirs = grid.values[def.direction][t] ?? []
  const vals = grid.values[def.value][t] ?? []
  const features = []
  for (let j = 0; j < grid.ny; j++)
    for (let i = 0; i < grid.nx; i++) {
      const d = dirs[j * grid.nx + i]
      const v = vals[j * grid.nx + i]
      if (d == null || v == null) continue
      const lon = grid.bbox.west + (i * (grid.bbox.east - grid.bbox.west)) / (grid.nx - 1)
      const lat = grid.bbox.north - (j * (grid.bbox.north - grid.bbox.south)) / (grid.ny - 1)
      features.push({
        type: 'Feature' as const,
        properties: { r: (d + 180) % 360 },
        geometry: { type: 'Point' as const, coordinates: [lon, lat] },
      })
    }
  return { type: 'FeatureCollection' as const, features }
}
