import { Box, ButtonBase, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import type { DaySummary } from '../lib/days'
import { surfRange } from '../lib/breaking'
import { dayLabel, ratingColor } from '../lib/surf'
import { alpha, brand } from '../theme'

export function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: DaySummary[]
  selected: string
  onSelect: (date: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // mantém o dia escolhido visível (14 dias não cabem na tela)
  useEffect(() => {
    const c = ref.current
    const el = c?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!c || !el) return
    if (el.offsetLeft < c.scrollLeft || el.offsetLeft + el.offsetWidth > c.scrollLeft + c.clientWidth)
      c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }, [selected])
  return (
    <Box
      ref={ref}
      role="tablist"
      aria-label="Dias da previsão"
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: { xs: '118px', md: 'minmax(112px, 1fr)' },
        gap: 1,
        overflowX: 'auto',
        pb: 0.5,
        position: 'relative',
        scrollbarWidth: 'thin',
      }}
    >
      {days.map((d, i) => {
        const { wd, dm } = dayLabel(d.date)
        const active = d.date === selected
        // depois de ~10 dias só o modelo de longo prazo: tendência, menos confiável
        const trend = d.hours.length > 0 && d.hours.every((h) => h.longRange)
        return (
          <ButtonBase
            key={d.date}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(d.date)}
            sx={{
              display: 'block',
              textAlign: 'left',
              p: 1.75,
              borderRadius: '16px',
              bgcolor: active ? brand.purple : 'background.paper',
              color: active ? brand.sand : 'text.primary',
              border: `1px ${trend && !active ? 'dashed' : 'solid'} ${active ? brand.purple : alpha(brand.purple, trend ? 0.3 : 0.08)}`,
              transition: 'background-color .2s, color .2s',
              '&:hover': { bgcolor: active ? brand.purple : alpha(brand.purple, 0.05) },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', opacity: 0.75, whiteSpace: 'nowrap' }}>
              {i === 0 ? 'Hoje' : wd} · {dm}
            </Typography>

            <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 }, whiteSpace: 'nowrap', letterSpacing: '-0.02em', my: 0.5 }}>
              {surfRange(d.maxSurf)}
            </Typography>
            <Box
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: active ? 'rgba(245,230,211,.2)' : alpha(brand.purple, 0.08),
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${Math.max(6, (d.best / 5) * 100)}%`,
                  height: '100%',
                  bgcolor: active ? brand.green : ratingColor(d.best),
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 10, fontWeight: 800, mt: 0.75, height: 12, lineHeight: '12px', opacity: 0.7, textTransform: 'uppercase' }}>
              {trend ? 'tendência' : ''}
            </Typography>
          </ButtonBase>
        )
      })}
    </Box>
  )
}
