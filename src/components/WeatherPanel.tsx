import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { DropletHalf, SunLight, Umbrella, Wind } from 'iconoir-react'
import type { DayWeather, HourPoint } from '../api/openMeteo'
import { dayLabel, fmt, weatherLabel } from '../lib/surf'
import { brand } from '../theme'
import { WeatherIcon } from './WeatherIcon'

function uvLabel(uv: number | null) {
  if (uv == null) return '—'
  const v = Math.round(uv)
  if (v < 3) return `${v} · baixo`
  if (v < 6) return `${v} · moderado`
  if (v < 8) return `${v} · alto`
  if (v < 11) return `${v} · muito alto`
  return `${v} · extremo`
}

export function WeatherPanel({
  days,
  selectedDate,
  hour,
  onSelectDay,
}: {
  days: DayWeather[]
  selectedDate: string
  hour: HourPoint
  onSelectDay: (date: string) => void
}) {
  const day = days.find((d) => d.date === selectedDate) ?? days[0]
  if (!day) return null
  const iconP = { width: 16, height: 16, color: brand.plum }

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
      <Typography variant="h6">Tempo</Typography>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(brand.green, 0.14),
            color: brand.deepGreen,
            flexShrink: 0,
          }}
        >
          <WeatherIcon code={hour.weatherCode} size={36} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {fmt.c(hour.airTemp)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
            {weatherLabel(hour.weatherCode)} · {fmt.hour(hour.time)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Máx {fmt.c(day.tMax)} · mín {fmt.c(day.tMin)}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mt: 2.5 }}>
        <Mini icon={<Umbrella {...iconP} />} label="Chuva" value={`${hour.rainChance ?? 0}% · ${(day.rainSum ?? 0).toFixed(1).replace('.', ',')} mm/dia`} />
        <Mini icon={<SunLight {...iconP} />} label="Índice UV" value={uvLabel(day.uvMax)} />
        <Mini icon={<DropletHalf {...iconP} />} label="Nuvens" value={hour.cloudCover == null ? '—' : `${Math.round(hour.cloudCover)}%`} />
        <Mini icon={<Wind {...iconP} />} label="Vento máx." value={fmt.kmh(day.windMax)} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(52px, 1fr)',
          gap: 0.5,
          mt: 2.5,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider',
          overflowX: 'auto',
        }}
      >
        {days.map((d, i) => {
          const active = d.date === day.date
          return (
            <ButtonBase
              key={d.date}
              onClick={() => onSelectDay(d.date)}
              aria-pressed={active}
              sx={{
                flexDirection: 'column',
                py: 1,
                borderRadius: '12px',
                bgcolor: active ? alpha(brand.purple, 0.07) : 'transparent',
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.65 }}>
                {i === 0 ? 'Hoje' : dayLabel(d.date).wd}
              </Typography>
              <Box sx={{ my: 0.5, color: brand.deepGreen }}>
                <WeatherIcon code={d.weatherCode} size={22} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{d.tMax == null ? '—' : Math.round(d.tMax)}°</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.6 }}>{d.tMin == null ? '—' : Math.round(d.tMin)}°</Typography>
            </ButtonBase>
          )
        })}
      </Box>
    </Paper>
  )
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        {icon}
        <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>{label}</Typography>
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  )
}
