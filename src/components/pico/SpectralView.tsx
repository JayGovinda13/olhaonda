import { Box } from '@mui/material'
import type { HourPoint } from '../../api/openMeteo'
import type { Spot } from '../../data/spots'
import { compass, energyColor, windKind } from '../../lib/surf'
import { brand } from '../../theme'
import { SpotDetailMap } from '../SpotDetailMap'
import { COMPONENTS } from './components'

/**
 * Visão "espectral": rosa polar sobre o mapa do pico.
 * Ângulo = de onde vem a componente; distância ao centro = período (anéis de 6, 10, 14 e 18 s).
 * Cada componente (mar de vento, swell 1, swell 2) vira uma seta apontando para o pico, com
 * tamanho pela altura e cor pela força (energia). No centro, o vento.
 */


const C = 200 // centro do viewBox 400x400
const RMAX = 172
const radius = (t: number) => Math.min(RMAX, Math.max(18, (t / 20) * RMAX))
const rad = (d: number) => (d * Math.PI) / 180
const at = (deg: number, r: number) => [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))] as const

/** Energia de uma componente (kJ por onda e metro de crista), mesma fórmula da "Força". */
function energy(h: number, t: number) {
  const L = (9.81 * t * t) / (2 * Math.PI)
  return (1025 * 9.81 * h * h * L) / 8 / 1000
}

type Comp = { key: string; label: string; stroke: string; h: number; dir: number; t: number }

function components(hour: HourPoint): Comp[] {
  const raw = [
    [hour.windWaveHeight, hour.windWaveDirection, hour.windWavePeriod],
    [hour.swellHeight, hour.swellDirection, hour.swellPeakPeriod ?? hour.swellPeriod],
    [hour.swell2Height, hour.swell2Direction, hour.swell2Period],
  ] as const
  return COMPONENTS.flatMap((c, i) => {
    const [h, dir, t] = raw[i]
    return h != null && dir != null && t != null && h >= 0.05 ? [{ ...c, h, dir, t }] : []
  })
}

const f1 = (v: number) => v.toFixed(1).replace('.', ',')

export function SpectralView({ spot, hour, height }: { spot: Spot; hour: HourPoint; height: number | { xs: number; md: number } }) {
  const comps = components(hour)
  const wk = windKind(spot, hour.windDirection, hour.windSpeed)
  const offshore = wk === 'terral' || wk === 'cross-terral' || wk === 'calmo'
  const [sx, sy] = at(spot.facing - 60, RMAX)
  const [ex, ey] = at(spot.facing + 60, RMAX)

  return (
    <Box sx={{ position: 'relative', height }}>
      <SpotDetailMap spot={spot} hour={hour} spectral mapHeight={height} />
      <Box
        component="svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Componentes do mar por direção e período"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {/* janela da praia (direções que entram de frente) */}
        <path d={`M${C} ${C} L${sx} ${sy} A${RMAX} ${RMAX} 0 0 1 ${ex} ${ey} Z`} fill={brand.green} fillOpacity="0.12" />
        {/* anéis de período */}
        {[6, 10, 14, 18].map((t) => (
          <g key={t}>
            <circle cx={C} cy={C} r={radius(t)} fill="none" stroke={brand.purple} strokeOpacity="0.28" strokeWidth="1.2" />
            <text x={C + 4} y={C + radius(t) - 4} fontSize="11" fontWeight="800" fill={brand.purple} opacity="0.75" style={halo}>
              {t} s
            </text>
          </g>
        ))}
        {/* eixos e rumos */}
        {['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'].map((l, i) => {
          const [x, y] = at(i * 45, RMAX + 14)
          const [x2, y2] = at(i * 45, RMAX)
          return (
            <g key={l}>
              <line x1={C} y1={C} x2={x2} y2={y2} stroke={brand.purple} strokeOpacity="0.14" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill={brand.purple} style={halo}>
                {l}
              </text>
            </g>
          )
        })}

        {/* componentes */}
        {comps.map((c) => {
          const r = radius(c.t)
          const [x, y] = at(c.dir, r)
          const size = 9 + 9 * Math.sqrt(Math.min(c.h, 4))
          const fill = energyColor(energy(c.h, c.t))
          return (
            <g key={c.key}>
              <line x1={x} y1={y} x2={C} y2={C} stroke={c.stroke} strokeWidth="1.6" strokeDasharray="4 4" opacity="0.8" />
              <g transform={`translate(${x} ${y}) rotate(${c.dir + 180})`}>
                <path d={`M0 ${-size} L${size * 0.72} ${size * 0.6} L0 ${size * 0.25} L${-size * 0.72} ${size * 0.6} Z`} fill={fill} stroke={c.stroke} strokeWidth="2.5" strokeLinejoin="round" />
              </g>
            </g>
          )
        })}

        {/* vento no centro: seta para onde sopra */}
        {hour.windDirection != null && (hour.windSpeed ?? 0) >= 1 && (
          <g transform={`translate(${C} ${C}) rotate(${hour.windDirection + 180})`}>
            <path d="M-9 -30 L0 -64 L9 -30 Z" fill={offshore ? brand.green : brand.plum} stroke={brand.sand} strokeWidth="2" />
          </g>
        )}
        <circle cx={C} cy={C} r="31" fill={brand.purple} stroke={brand.sand} strokeWidth="3" />
        <text x={C} y={C + 2} textAnchor="middle" fontSize="18" fontWeight="800" fill={brand.sand}>
          {Math.round(hour.windSpeed ?? 0)}
        </text>
        <text x={C} y={C + 16} textAnchor="middle" fontSize="10" fontWeight="700" fill={brand.sand} opacity="0.85">
          km/h
        </text>
      </Box>
      {/* lista das componentes (sem sobrepor as setas) */}
      <Box sx={{ position: 'absolute', left: 8, top: 8, display: 'flex', flexDirection: 'column', gap: 0.5, pointerEvents: 'none' }}>
        {comps.map((c) => (
          <Box
            key={c.key}
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: '8px',
              bgcolor: 'rgba(251,244,236,.94)',
              borderLeft: `4px solid ${c.stroke}`,
              fontSize: 11,
              fontWeight: 800,
              color: brand.purple,
              lineHeight: 1.35,
            }}
          >
            {c.label}: {Math.round(c.dir)}° {compass(c.dir)} · {f1(c.h)} m · {f1(c.t)} s
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const halo = { paintOrder: 'stroke', stroke: 'rgba(251,244,236,.9)', strokeWidth: 4 } as const
