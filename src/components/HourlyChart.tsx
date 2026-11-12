import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { surfEstimate } from '../lib/breaking'
import { energyRatio, fmt, fmtJoules, rate, ratingColor, waveEnergy, windKind } from '../lib/surf'
import { alpha, brand } from '../theme'
import { DirArrow } from './bits'
import { WeatherIcon } from './WeatherIcon'

const ROW_LABEL = {
  fontSize: 11,
  fontWeight: 700,
  opacity: 0.6,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  display: 'flex',
  alignItems: 'center',
} as const

/** Alturas fixas das linhas abaixo das barras (rótulos e colunas usam as mesmas). */
const ROWS = [
  { key: 'hora', label: 'Hora', h: 22 },
  { key: 'swell', label: 'Período', h: 22 },
  { key: 'swelldir', label: 'Swell °', h: 22 },
  { key: 'forca', label: 'Energia (J)', h: 30 },
  { key: 'vento', label: 'Vento', h: 50 },
  { key: 'tempo', label: 'Tempo', h: 28 },
] as const

const BAR_H = 120
const TOP = 16 + BAR_H + 8 // valor + barra + respiro

export function HourlyChart({
  spot,
  hours,
  scaleMax,
  selected,
  onSelect,
}: {
  spot: Spot
  hours: HourPoint[]
  /** Altura máxima da semana, para as barras serem comparáveis entre dias. */
  scaleMax: number
  selected: string
  onSelect: (time: string) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)

  // Mantém a hora selecionada visível rolando só o contêiner (não a página).
  useEffect(() => {
    const box = scroller.current
    const el = box?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (box && el) {
      box.scrollTo({ left: el.offsetLeft - box.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
    }
  }, [selected])

  const max = Math.max(scaleMax, 0.5)

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
        <Typography variant="h6">Hora a hora</Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {(
            [
              ['Fraco', 1.5],
              ['Regular', 2.5],
              ['Bom', 3.5],
              ['Muito bom', 4.5],
            ] as const
          ).map(([l, s]) => (
            <Stack key={l} direction="row" spacing={0.5} sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: ratingColor(s) }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {l}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{ flexShrink: 0, pt: `${TOP + 8}px` }}>
          {ROWS.map((r) => (
            <Typography key={r.key} sx={{ ...ROW_LABEL, height: r.h }}>
              {r.label}
            </Typography>
          ))}
        </Box>

        <Box
          ref={scroller}
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(44px, 1fr)',
            gap: 0.5,
            overflowX: 'auto',
            flex: 1,
            pb: 1,
          }}
        >
          {hours.map((h) => {
            const r = rate(spot, h)
            const hs = surfEstimate(spot, h)?.hb ?? 0
            const active = h.time === selected
            const wk = windKind(spot, h.windDirection, h.windSpeed)
            const good = wk === 'terral' || wk === 'cross-terral' || wk === 'calmo'
            const energy = waveEnergy(h)
            const hr = Number(h.time.slice(11, 13))
            return (
              <ButtonBase
                key={h.time}
                aria-pressed={active}
                aria-label={`${fmt.hour(h.time)}: ${fmt.m(hs)}, ${r.label}`}
                onClick={() => onSelect(h.time)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  borderRadius: '12px',
                  py: 1,
                  bgcolor: active ? alpha(brand.purple, 0.07) : 'transparent',
                  outline: active ? `1.5px solid ${alpha(brand.purple, 0.35)}` : 'none',
                  '&:hover': { bgcolor: alpha(brand.purple, 0.05) },
                  '& > *': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 800, height: 16 }}>{hs.toFixed(1).replace('.', ',')}</Typography>
                <Box sx={{ height: BAR_H, alignItems: 'flex-end !important' }}>
                  <Box
                    sx={{
                      width: '62%',
                      height: `${Math.max(3, (hs / max) * 100)}%`,
                      bgcolor: ratingColor(r.score),
                      borderRadius: '6px 6px 2px 2px',
                      transition: 'height .4s ease',
                    }}
                  />
                </Box>
                <Box sx={{ height: 8 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, height: ROWS[0].h }}>{fmt.hour(h.time)}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.75, height: ROWS[1].h }}>
                  {fmt.s(h.swellPeakPeriod ?? h.swellPeriod)}
                </Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.75, height: ROWS[2].h }}>
                  {h.swellDirection == null ? '—' : `${Math.round(h.swellDirection)}°`}
                </Typography>
                <Box sx={{ height: ROWS[3].h, flexDirection: 'column', gap: '3px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                    {fmtJoules(energy)}
                  </Typography>
                  <Box sx={{ width: '60%', height: 3, borderRadius: 2, bgcolor: alpha(brand.purple, 0.1), overflow: 'hidden' }}>
                    <Box sx={{ width: `${energyRatio(energy) * 100}%`, height: '100%', bgcolor: brand.plum }} />
                  </Box>
                </Box>
                <Stack sx={{ height: ROWS[4].h, color: good ? brand.green : brand.plum }}>
                  <DirArrow deg={h.windDirection} size={16} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.1 }}>{Math.round(h.windSpeed ?? 0)}</Typography>
                  <Typography sx={{ fontSize: 10, opacity: 0.8, lineHeight: 1.1 }}>
                    {h.windDirection == null ? '' : `${Math.round(h.windDirection)}°`}
                  </Typography>
                </Stack>
                <Box sx={{ height: ROWS[5].h, color: brand.deepGreen }}>
                  <WeatherIcon code={h.weatherCode} size={18} night={hr < 6 || hr >= 19} />
                </Box>
              </ButtonBase>
            )
          })}
        </Box>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.6 }}>
        Barras: altura estimada na arrebentação (séries, m). Swell °: direção de onde vem o swell, em graus. Energia: joules (J) de cada onda por metro de crista. Vento em km/h e graus (de onde sopra); verde = terral ou fraco, vinho =
        maral/lateral.
      </Typography>
    </Paper>
  )
}
