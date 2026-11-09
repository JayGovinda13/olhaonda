import { Box, Paper, Stack, Typography } from '@mui/material'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { angleDiff, compass, WIND_LABEL, windKind } from '../lib/surf'
import { brand } from '../theme'

/** Rosa dos ventos: setor de exposição da praia, swell e vento chegando. */
export function SpotCompass({ spot, hour }: { spot: Spot; hour: HourPoint }) {
  const C = 100
  const R = 78
  const pt = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return [C + r * Math.cos(a), C + r * Math.sin(a)] as const
  }
  // setor ±60° em torno da orientação da praia
  const [sx, sy] = pt(spot.facing - 60, R)
  const [ex, ey] = pt(spot.facing + 60, R)
  const sector = `M${C} ${C} L${sx} ${sy} A${R} ${R} 0 0 1 ${ex} ${ey} Z`

  // seta entrando: começa na borda (de onde vem) e aponta para o centro
  const arrow = (deg: number | null, color: string, len: number) => {
    if (deg == null) return null
    const [x1, y1] = pt(deg, R + 4)
    const [x2, y2] = pt(deg, R + 4 - len)
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="6" strokeLinecap="round" />
        <circle cx={x2} cy={y2} r="6" fill={color} />
      </g>
    )
  }

  const exposure = hour.swellDirection == null ? null : angleDiff(hour.swellDirection, spot.facing)
  const wk = windKind(spot, hour.windDirection, hour.windSpeed)

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
      <Typography variant="h6">O pico</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' }, gap: 3, alignItems: 'center', mt: 1.5 }}>
        <Box component="svg" viewBox="-24 -24 248 248" sx={{ width: 200, maxWidth: '100%', mx: 'auto', display: 'block' }}>
          <circle cx={C} cy={C} r={R} fill="none" stroke={brand.purple} strokeOpacity="0.14" strokeWidth="2" />
          <circle cx={C} cy={C} r={R * 0.55} fill="none" stroke={brand.purple} strokeOpacity="0.08" strokeWidth="2" />
          <path d={sector} fill={brand.green} fillOpacity="0.18" />
          {['N', 'L', 'S', 'O'].map((l, i) => {
            const [x, y] = pt(i * 90, R + 24)
            return (
              <text
                key={l}
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="800"
                fill={brand.purple}
                opacity="0.55"
                style={{ paintOrder: 'stroke', stroke: '#FBF4EC', strokeWidth: 6 }}
              >
                {l}
              </text>
            )
          })}
          {arrow(hour.windDirection, brand.plum, 34)}
          {arrow(hour.swellDirection, brand.deepGreen, 56)}
          <circle cx={C} cy={C} r="5" fill={brand.purple} />
        </Box>
        <Stack spacing={1.5}>
          <Legend color={brand.green} soft label="Janela da praia" value={`Voltada para ${compass(spot.facing)} (${spot.facing}°)`} />
          <Legend
            color={brand.deepGreen}
            label="Swell"
            value={
              exposure == null
                ? '—'
                : `De ${compass(hour.swellDirection)} · ${exposure < 45 ? 'entra de frente' : exposure < 90 ? 'entra de lado' : 'bloqueado pela costa'}`
            }
          />
          <Legend color={brand.plum} label="Vento" value={`De ${compass(hour.windDirection)} · ${WIND_LABEL[wk]}`} />
        </Stack>
      </Box>
    </Paper>
  )
}

function Legend({ color, label, value, soft }: { color: string; label: string; value: string; soft?: boolean }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ width: 12, height: 12, mt: 0.5, borderRadius: 1, bgcolor: color, opacity: soft ? 0.4 : 1, flexShrink: 0 }} />
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}
