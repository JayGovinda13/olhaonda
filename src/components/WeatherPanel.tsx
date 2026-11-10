import { Box, ButtonBase, Collapse, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { DropletHalf, HalfMoon, SunLight, Umbrella } from 'iconoir-react'
import { useEffect, useRef, useState } from 'react'
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
  dayHours,
  onSelectDay,
  onSelectHour,
}: {
  days: DayWeather[]
  selectedDate: string
  hour: HourPoint
  /** horas do dia escolhido */
  dayHours: HourPoint[]
  onSelectDay: (date: string) => void
  onSelectHour: (time: string) => void
}) {
  // as horas abrem só depois que a pessoa escolhe um dia; tocar de novo no mesmo dia fecha
  const [openDate, setOpenDate] = useState<string | null>(null)
  const strip = useRef<HTMLDivElement>(null)
  const daysRef = useRef<HTMLDivElement>(null)
  // dia escolhido sempre visível na faixa de 14 dias
  useEffect(() => {
    const c = daysRef.current
    const el = c?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (c && el) c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }, [selectedDate])
  // centraliza a hora escolhida na faixa (sem rolar a página)
  useEffect(() => {
    const c = strip.current
    const el = c?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (c && el) c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [openDate, hour.time])
  const day = days.find((d) => d.date === selectedDate) ?? days[0]
  if (!day) return null
  const open = openDate === day.date && dayHours.length > 0
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
        <Mini icon={<HalfMoon {...iconP} />} label="Nascer e pôr do sol" value={day.sunrise ? `${fmt.hour(day.sunrise)} – ${fmt.hour(day.sunset)}` : '—'} />
      </Box>

      <Box
        ref={daysRef}
        sx={{
          position: 'relative',
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
              onClick={() => {
                if (active && openDate === d.date) return setOpenDate(null)
                onSelectDay(d.date)
                setOpenDate(d.date)
              }}
              aria-pressed={active}
              aria-expanded={active ? open : undefined}
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

      <Collapse in={open} unmountOnExit>
        <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, mt: 2, mb: 1 }}>
          Hora a hora · {dayLabel(day.date).wd} {dayLabel(day.date).dm}
        </Typography>
        <Box ref={strip} sx={{ position: 'relative', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '56px', gap: 0.5, overflowX: 'auto', pb: 0.5 }}>
          {dayHours.map((h) => {
            const active = h.time === hour.time
            return (
              <ButtonBase
                key={h.time}
                onClick={() => onSelectHour(h.time)}
                aria-pressed={active}
                sx={{
                  flexDirection: 'column',
                  py: 1,
                  borderRadius: '12px',
                  border: `1px solid ${alpha(brand.purple, active ? 0.35 : 0.08)}`,
                  bgcolor: active ? alpha(brand.green, 0.12) : 'transparent',
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 800, opacity: 0.65 }}>{fmt.hour(h.time)}</Typography>
                <Box sx={{ my: 0.5, color: brand.deepGreen }}>
                  <WeatherIcon code={h.weatherCode} size={20} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{h.airTemp == null ? '—' : Math.round(h.airTemp)}°</Typography>
                <Typography sx={{ fontSize: 11, opacity: 0.6, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Umbrella width={10} height={10} />
                  {h.rainChance ?? 0}%
                </Typography>
              </ButtonBase>
            )
          })}
        </Box>
      </Collapse>
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
