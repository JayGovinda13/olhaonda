import { Box, ButtonBase, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { DaySummary } from '../lib/days'
import { dayLabel, faceRange, ratingColor } from '../lib/surf'
import { brand } from '../theme'

export function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: DaySummary[]
  selected: string
  onSelect: (date: string) => void
}) {
  return (
    <Box
      role="tablist"
      aria-label="Dias da previsão"
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: { xs: '118px', md: '1fr' },
        gap: 1,
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'none',
      }}
    >
      {days.map((d, i) => {
        const { wd, dm } = dayLabel(d.date)
        const active = d.date === selected
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
              border: `1px solid ${active ? brand.purple : alpha(brand.purple, 0.08)}`,
              transition: 'background-color .2s, color .2s',
              '&:hover': { bgcolor: active ? brand.purple : alpha(brand.purple, 0.05) },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', opacity: 0.75, whiteSpace: 'nowrap' }}>
              {i === 0 ? 'Hoje' : wd} · {dm}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 }, whiteSpace: 'nowrap', letterSpacing: '-0.02em', my: 0.5 }}>
              {faceRange(d.maxHs)}
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
          </ButtonBase>
        )
      })}
    </Box>
  )
}
