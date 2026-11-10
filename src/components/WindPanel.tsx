import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { dirDeg, fmt, WIND_LABEL, windKind, windStrength, type WindKind } from '../lib/surf'
import { brand } from '../theme'
import { dayLabel } from '../lib/surf'
import { windDay, windSummary } from '../lib/dayText'
import { DirArrow } from './bits'
import { DaySummaryBox } from './DaySummaryBox'

const GOOD: WindKind[] = ['terral', 'cross-terral', 'calmo']
const kindColor = (k: WindKind) => (GOOD.includes(k) ? brand.green : brand.plum)

/** Escala Beaufort (km/h) com nomes curtos. */
function beaufort(kmh: number | null) {
  if (kmh == null) return '—'
  const lim = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]
  const names = ['Calmaria', 'Aragem', 'Brisa leve', 'Brisa fraca', 'Brisa moderada', 'Brisa forte', 'Vento fresco', 'Vento forte', 'Ventania', 'Ventania forte', 'Tempestade', 'Tempestade violenta', 'Furacão']
  const b = lim.findIndex((l) => kmh < l)
  const n = b === -1 ? 12 : b
  return `${n} · ${names[n]}`
}

/** Vento do pico: velocidade, rajada, direção em graus e se é terral ou maral, hora a hora no dia escolhido. */
export function WindPanel({
  spot,
  hour,
  dayHours,
  allHours,
  onSelectHour,
  onSelectDay,
}: {
  spot: Spot
  hour: HourPoint
  dayHours: HourPoint[]
  /** todas as horas (14 dias), para a faixa de dias */
  allHours: HourPoint[]
  onSelectHour: (time: string) => void
  onSelectDay: (date: string) => void
}) {
  const wk = windKind(spot, hour.windDirection, hour.windSpeed)
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const c = strip.current
    const el = c?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (c && el) c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [hour.time])

  const speeds = dayHours.map((h) => h.windSpeed ?? 0)
  const gusts = dayHours.map((h) => h.windGusts ?? 0)
  const max = Math.max(20, ...gusts, ...speeds)
  const W = 300
  const H = 70
  const x = (i: number) => (dayHours.length <= 1 ? W / 2 : (i / (dayHours.length - 1)) * W)
  const y = (v: number) => H - (v / max) * (H - 6)
  const line = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const selIdx = dayHours.findIndex((h) => h.time === hour.time)

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="h6">Vento</Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: kindColor(wk) }}>
          {WIND_LABEL[wk]}
          {wk !== 'calmo' && ` · ${windStrength(hour.windSpeed).toLowerCase()}`}
        </Typography>
      </Stack>

      <WindDays spot={spot} allHours={allHours} selectedDate={hour.time.slice(0, 10)} onSelectDay={onSelectDay} />

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(kindColor(wk), 0.14),
            color: kindColor(wk),
            flexShrink: 0,
          }}
        >
          <DirArrow deg={hour.windDirection} size={34} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {hour.windSpeed == null ? '—' : Math.round(hour.windSpeed)}
            <Box component="span" sx={{ fontSize: 16, ml: 0.5, letterSpacing: 0 }}>
              km/h
            </Box>
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
            De {dirDeg(hour.windDirection)} · {fmt.hour(hour.time)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Rajadas {fmt.kmh(hour.windGusts)} · {hour.windSpeed == null ? '—' : `${Math.round(hour.windSpeed / 1.852)} nós`}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mt: 2.5 }}>
        <Mini label="Máx. no dia" value={fmt.kmh(Math.max(...speeds, 0))} />
        <Mini label="Rajada máx." value={fmt.kmh(Math.max(...gusts, 0))} />
        <Mini label="Beaufort" value={beaufort(hour.windSpeed)} />
        <Mini label="Praia voltada" value={dirDeg(spot.facing)} />
      </Box>

      {/* velocidade e rajada ao longo do dia */}
      {dayHours.length > 1 && (
        <Box
          component="svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          sx={{ display: 'block', width: '100%', height: 70, mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider', overflow: 'visible' }}
          aria-hidden
        >
          <path d={line(gusts)} fill="none" stroke={alpha(brand.purple, 0.3)} strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <path d={`${line(speeds)} L${W},${H} L0,${H} Z`} fill={alpha(brand.green, 0.15)} />
          <path d={line(speeds)} fill="none" stroke={brand.deepGreen} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          {selIdx >= 0 && <line x1={x(selIdx)} x2={x(selIdx)} y1={0} y2={H} stroke={brand.purple} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
        </Box>
      )}

      <Box ref={strip} sx={{ position: 'relative', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '52px', gap: 0.5, overflowX: 'auto', mt: 1.5, pb: 0.5 }}>
        {dayHours.map((h) => {
          const active = h.time === hour.time
          const k = windKind(spot, h.windDirection, h.windSpeed)
          return (
            <ButtonBase
              key={h.time}
              onClick={() => onSelectHour(h.time)}
              aria-pressed={active}
              aria-label={`${fmt.hour(h.time)}: ${fmt.kmh(h.windSpeed)}, ${WIND_LABEL[k]}`}
              sx={{
                flexDirection: 'column',
                py: 0.75,
                borderRadius: '10px',
                bgcolor: active ? brand.purple : alpha(brand.purple, 0.04),
                color: active ? brand.sand : 'text.primary',
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{fmt.hour(h.time)}</Typography>
              <Box sx={{ display: 'flex', my: 0.25, color: active ? brand.sand : kindColor(k) }}>
                <DirArrow deg={h.windDirection} size={14} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{h.windSpeed == null ? '—' : Math.round(h.windSpeed)}</Typography>
              <Typography sx={{ fontSize: 10, opacity: 0.65 }}>{h.windGusts == null ? '' : `raj ${Math.round(h.windGusts)}`}</Typography>
            </ButtonBase>
          )
        })}
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.6 }}>
        Linha cheia: vento médio; tracejada: rajadas (km/h). Seta para onde o vento sopra; verde = terral ou fraco.
      </Typography>
      <DaySummaryBox title="Resumo do vento" lines={windSummary(spot, dayHours)} />
    </Paper>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }} noWrap>
        {value}
      </Typography>
    </Box>
  )
}

/** Os 14 dias de vento: direção média com luz do dia, velocidade média e rajada máxima. Verde = manhã terral ou fraca. */
function WindDays({
  spot,
  allHours,
  selectedDate,
  onSelectDay,
}: {
  spot: Spot
  allHours: HourPoint[]
  selectedDate: string
  onSelectDay: (date: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const c = ref.current
    const el = c?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (c && el) c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }, [selectedDate])
  const byDay = new Map<string, HourPoint[]>()
  for (const h of allHours) {
    const d = h.time.slice(0, 10)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(h)
  }
  return (
    <Box
      ref={ref}
      role="group"
      aria-label="Vento dos 14 dias"
      sx={{ position: 'relative', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '64px', gap: 0.5, overflowX: 'auto', mt: 1.5, pb: 0.5 }}
    >
      {[...byDay.entries()].map(([date, hs], i) => {
        const d = windDay(spot, hs)
        const active = date === selectedDate
        const { wd, dm } = dayLabel(date)
        const color = d.goodMorning ? brand.green : brand.plum
        return (
          <ButtonBase
            key={date}
            aria-pressed={active}
            aria-label={`${wd} ${dm}: ${d.avg == null ? '—' : Math.round(d.avg)} km/h, rajadas ${Math.round(d.gust)}`}
            onClick={() => onSelectDay(date)}
            sx={{
              flexDirection: 'column',
              py: 0.75,
              borderRadius: '12px',
              bgcolor: active ? brand.purple : alpha(brand.purple, 0.04),
              color: active ? brand.sand : 'text.primary',
              border: hs.every((h) => h.longRange) && !active ? `1px dashed ${alpha(brand.purple, 0.3)}` : '1px solid transparent',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.75 }}>
              {i === 0 ? 'Hoje' : wd} {dm.slice(0, 2)}
            </Typography>
            <Box sx={{ display: 'flex', my: 0.5, color: active ? brand.sand : color }}>
              <DirArrow deg={d.dir} size={18} />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{d.avg == null ? '—' : Math.round(d.avg)}</Typography>
            <Typography sx={{ fontSize: 10, opacity: 0.65 }}>raj {Math.round(d.gust)}</Typography>
          </ButtonBase>
        )
      })}
    </Box>
  )
}
