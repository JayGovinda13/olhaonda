import { Box, Slider, Stack, Switch, Typography } from '@mui/material'
import { useId } from 'react'
import { alpha, brand } from '../../theme'
import { dirDeg } from '../../../supabase/functions/_shared/core/surf.ts'

const R = 50
const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return `${(60 + r * Math.sin(a)).toFixed(1)} ${(60 - r * Math.cos(a)).toFixed(1)}`
}

/** Fatia da bússola entre `from` e `to` (graus, sentido horário a partir do norte). */
function sector(from: number, to: number) {
  const span = (((to - from) % 360) + 360) % 360
  if (span >= 359) return `M60 60 m-${R} 0 a${R} ${R} 0 1 0 ${R * 2} 0 a${R} ${R} 0 1 0 -${R * 2} 0`
  return `M60 60 L${pt(from, R)} A${R} ${R} 0 ${span > 180 ? 1 : 0} 1 ${pt(to, R)} Z`
}

/**
 * Direção em graus com tolerância, numa bússola. `value = null` significa "qualquer direção".
 * Os graus são "de onde vem" (como no card do pico): 180° = vem do sul.
 */
export function DegreePicker({
  label,
  hint,
  value,
  tol,
  defaultValue,
  anyLabel = 'Qualquer direção',
  color = brand.green,
  onChange,
}: {
  label: string
  hint?: string
  value: number | null
  tol: number
  defaultValue: number
  anyLabel?: string
  color?: string
  onChange: (value: number | null, tol: number) => void
}) {
  const id = useId()
  const on = value != null
  const v = value ?? defaultValue
  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <Typography variant="caption" id={id} sx={{ fontWeight: 700 }}>
            {on ? 'Escolher a direção' : anyLabel}
          </Typography>
          <Switch size="small" checked={on} onChange={(e) => onChange(e.target.checked ? defaultValue : null, tol)} color="success" slotProps={{ input: { 'aria-labelledby': id } }} />
        </Stack>
      </Stack>
      {hint && (
        <Typography variant="caption" sx={{ opacity: 0.65, display: 'block', mb: 0.5 }}>
          {hint}
        </Typography>
      )}
      {on && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 0.5 }}>
          <svg width="112" height="112" viewBox="0 0 120 120" role="img" aria-label={`${dirDeg(v)}, mais ou menos ${tol} graus`} style={{ flexShrink: 0 }}>
            <circle cx="60" cy="60" r={R} fill={alpha(brand.purple, 0.05)} stroke={alpha(brand.purple, 0.25)} />
            <path d={sector(v - tol, v + tol)} fill={alpha(color, 0.35)} stroke={color} strokeWidth="1.5" />
            <line x1="60" y1="60" x2={pt(v, R).split(' ')[0]} y2={pt(v, R).split(' ')[1]} stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle cx={pt(v, R).split(' ')[0]} cy={pt(v, R).split(' ')[1]} r="5" fill={color} />
            {[
              ['N', 0],
              ['L', 90],
              ['S', 180],
              ['O', 270],
            ].map(([t, a]) => (
              <text key={t} x={pt(a as number, R + 9).split(' ')[0]} y={Number(pt(a as number, R + 9).split(' ')[1]) + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill={brand.purple} opacity="0.7">
                {t}
              </text>
            ))}
          </svg>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {dirDeg(v)} ±{tol}°
            </Typography>
            <Slider value={v} min={0} max={359} step={5} onChange={(_, x) => onChange(x as number, tol)} color="success" aria-label={`${label}: direção em graus`} />
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Aceita de {dirDeg(((v - tol + 360) % 360))} a {dirDeg((v + tol) % 360)}
            </Typography>
            <Slider value={tol} min={10} max={90} step={5} onChange={(_, x) => onChange(v, x as number)} color="success" aria-label={`${label}: tolerância em graus`} />
          </Box>
        </Stack>
      )}
    </Box>
  )
}
