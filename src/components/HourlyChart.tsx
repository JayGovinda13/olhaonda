import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { fmt, rate, ratingColor, windKind } from '../lib/surf'
import { brand } from '../theme'
import { DirArrow } from './bits'

const ROW_LABEL = { fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.05em' } as const

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

  // Mantém a hora selecionada visível ao trocar de dia.
  useEffect(() => {
    // rola só o próprio contêiner (scrollIntoView rolaria a página inteira)
    const box = scroller.current
    const el = box?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (box && el) {
      box.scrollTo({ left: el.offsetLeft - box.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
    }
  }, [selected])

  const BAR_H = 120
  const max = Math.max(scaleMax, 0.5)

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
        <Typography variant="h6">Hora a hora</Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {[
            ['Fraco', 1.5],
            ['Regular', 2.5],
            ['Bom', 3.5],
            ['Muito bom', 4.5],
          ].map(([l, s]) => (
            <Stack key={l} direction="row" spacing={0.5} sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: ratingColor(s as number) }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {l}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* rótulos das linhas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', pt: `${BAR_H + 30}px`, gap: '10px', flexShrink: 0 }}>
          <Typography sx={ROW_LABEL}>Hora</Typography>
          <Typography sx={ROW_LABEL}>Swell</Typography>
          <Typography sx={ROW_LABEL}>Vento</Typography>
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
            const hs = h.waveHeight ?? 0
            const active = h.time === selected
            const wk = windKind(spot, h.windDirection, h.windSpeed)
            const good = wk === 'terral' || wk === 'cross-terral' || wk === 'calmo'
            return (
              <ButtonBase
                key={h.time}
                aria-pressed={active}
                aria-label={`${fmt.hour(h.time)}: ${fmt.m(hs)}, ${r.label}`}
                onClick={() => onSelect(h.time)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  borderRadius: 2,
                  py: 1,
                  bgcolor: active ? alpha(brand.purple, 0.07) : 'transparent',
                  outline: active ? `1.5px solid ${alpha(brand.purple, 0.35)}` : 'none',
                  '&:hover': { bgcolor: alpha(brand.purple, 0.05) },
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 800, height: 16 }}>
                  {hs.toFixed(1).replace('.', ',')}
                </Typography>
                <Box sx={{ height: BAR_H, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
                <Typography sx={{ fontSize: 12, fontWeight: 700, mt: 1, height: 18 }}>{fmt.hour(h.time)}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.75, height: 18, mt: '6px' }}>
                  {fmt.s(h.swellPeakPeriod ?? h.swellPeriod)}
                </Typography>
                <Stack sx={{ alignItems: 'center', mt: '6px', color: good ? brand.green : brand.plum }}>
                  <DirArrow deg={h.windDirection} size={16} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{Math.round(h.windSpeed ?? 0)}</Typography>
                </Stack>
              </ButtonBase>
            )
          })}
        </Box>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.6 }}>
        Barras: altura significativa (m). Vento em km/h; verde = terral ou fraco, vinho = maral/lateral.
      </Typography>
    </Paper>
  )
}
