import { Box, Paper, Stack, Typography } from '@mui/material'
import { HalfMoon, SunLight } from 'iconoir-react'
import { useId } from 'react'
import type { DayWeather, HourPoint } from '../api/openMeteo'
import { fmt } from '../lib/surf'
import { brand } from '../theme'

type Extreme = { time: string; level: number; kind: 'alta' | 'baixa' }

function extremes(hours: HourPoint[]): Extreme[] {
  const out: Extreme[] = []
  for (let i = 1; i < hours.length - 1; i++) {
    const [a, b, c] = [hours[i - 1].seaLevel, hours[i].seaLevel, hours[i + 1].seaLevel]
    if (a == null || b == null || c == null) continue
    if (b > a && b >= c) out.push({ time: hours[i].time, level: b, kind: 'alta' })
    if (b < a && b <= c) out.push({ time: hours[i].time, level: b, kind: 'baixa' })
  }
  return out
}

export function TidePanel({ hours, selected, sun }: { hours: HourPoint[]; selected: string; sun?: DayWeather }) {
  const grad = useId()
  const levels = hours.map((h) => h.seaLevel)
  const valid = levels.filter((v): v is number => v != null)

  const W = 480
  const H = 140
  const PAD = 14
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const span = Math.max(max - min, 0.2)
  const x = (i: number) => PAD + (i / Math.max(1, hours.length - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2)

  const pts = levels.map((v, i) => (v == null ? null : [x(i), y(v)] as const)).filter(Boolean) as [number, number][]
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z` : ''
  const selIdx = hours.findIndex((h) => h.time === selected)
  const sel = selIdx >= 0 ? hours[selIdx].seaLevel : null
  const ext = extremes(hours)

  let trend = ''
  if (selIdx >= 0 && selIdx < hours.length - 1) {
    const a = hours[selIdx].seaLevel
    const b = hours[selIdx + 1].seaLevel
    if (a != null && b != null) trend = b > a ? 'enchendo' : 'secando'
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="h6">Maré</Typography>
        {trend && (
          <Typography variant="body2" sx={{ fontWeight: 700, color: brand.green }}>
            {trend} · {sel != null ? `${sel.toFixed(2).replace('.', ',')} m` : ''}
          </Typography>
        )}
      </Stack>

      {valid.length ? (
        <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: '100%', height: 'auto', mt: 1.5, display: 'block' }}>
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={brand.green} stopOpacity="0.35" />
              <stop offset="1" stopColor={brand.green} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${grad})`} />
          <path d={line} fill="none" stroke={brand.deepGreen} strokeWidth="2.5" strokeLinejoin="round" />
          {selIdx >= 0 && sel != null && (
            <g>
              <line x1={x(selIdx)} x2={x(selIdx)} y1={PAD / 2} y2={H} stroke={brand.purple} strokeDasharray="3 4" opacity="0.5" />
              <circle cx={x(selIdx)} cy={y(sel)} r="6" fill={brand.purple} stroke={brand.sand} strokeWidth="2.5" />
            </g>
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
          Sem dados de maré para este ponto.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {ext.map((e) => (
          <Box
            key={e.time}
            sx={{
              px: 1.25,
              py: 0.75,
              borderRadius: 2,
              bgcolor: e.kind === 'alta' ? 'rgba(47,174,123,.14)' : 'rgba(122,46,110,.1)',
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>
              {e.kind}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
              {fmt.hour(e.time)} · {e.level.toFixed(1).replace('.', ',')} m
            </Typography>
          </Box>
        ))}
      </Box>

      {sun && (
        <Stack direction="row" spacing={3} sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SunLight width={18} height={18} color={brand.plum} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {fmt.hour(sun.sunrise)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <HalfMoon width={18} height={18} color={brand.plum} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {fmt.hour(sun.sunset)}
            </Typography>
          </Stack>
        </Stack>
      )}
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.6 }}>
        Nível do mar modelado (resolução ~8 km). Em baías e estuários confira a tábua da Marinha.
      </Typography>
    </Paper>
  )
}
