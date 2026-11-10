import { useMemo } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { peakHour, windDay, windSummary } from '../lib/dayText'
import { compass, dirDeg, fmt, WIND_LABEL, windKind, windStrength, type WindKind } from '../lib/surf'
import { brand } from '../theme'
import { DirArrow } from './bits'
import { CardShell, DayChart, DayChips, HourChips, NowBlock, StatGrid, SummaryFooter } from './conditions/parts'

const GOOD: WindKind[] = ['terral', 'cross-terral', 'calmo']
const kindColor = (k: WindKind) => (GOOD.includes(k) ? brand.green : brand.plum)

/** Escala Beaufort (km/h). */
function beaufort(kmh: number | null) {
  if (kmh == null) return { n: '—', name: '' }
  const lim = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]
  const names = ['calmaria', 'aragem', 'brisa leve', 'brisa fraca', 'brisa moderada', 'brisa forte', 'vento fresco', 'vento forte', 'ventania', 'ventania forte', 'tempestade', 'tempestade violenta', 'furacão']
  const b = lim.findIndex((l) => kmh < l)
  const n = b === -1 ? 12 : b
  return { n: String(n), name: names[n] }
}

const byDay = (hours: HourPoint[]) => {
  const m = new Map<string, HourPoint[]>()
  for (const h of hours) {
    const d = h.time.slice(0, 10)
    if (!m.has(d)) m.set(d, [])
    m.get(d)!.push(h)
  }
  return [...m.entries()]
}

/** Vento do pico: velocidade, direção, rajadas e terral/maral. */
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
  allHours: HourPoint[]
  onSelectHour: (time: string) => void
  onSelectDay: (date: string) => void
}) {
  const wk = windKind(spot, hour.windDirection, hour.windSpeed)
  const days = useMemo(() => byDay(allHours), [allHours])
  const summary = useMemo(() => windSummary(spot, dayHours), [spot, dayHours])
  const speeds = dayHours.map((h) => h.windSpeed ?? 0)
  const gusts = dayHours.map((h) => h.windGusts ?? 0)
  const top = Math.max(20, ...gusts, ...speeds) * 1.1
  const bf = beaufort(hour.windSpeed)

  return (
    <CardShell
      title="Vento"
      status={`${WIND_LABEL[wk]}${wk !== 'calmo' ? ` · ${windStrength(hour.windSpeed).toLowerCase()}` : ''}`}
      statusColor={kindColor(wk)}
    >
      <DayChips
        label="Vento dos 14 dias"
        selectedDate={hour.time.slice(0, 10)}
        onSelect={onSelectDay}
        days={days.map(([date, hs]) => {
          const d = windDay(spot, hs)
          return {
            date,
            trend: hs.every((h) => h.longRange),
            glyph: <DirArrow deg={d.dir} size={18} color={d.goodMorning ? brand.green : brand.plum} />,
            value: d.avg == null ? '—' : `${Math.round(d.avg)}`,
            sub: `raj ${Math.round(d.gust)}`,
          }
        })}
      />

      <NowBlock
        icon={<DirArrow deg={hour.windDirection} size={30} />}
        tint={kindColor(wk)}
        value={hour.windSpeed == null ? '—' : `${Math.round(hour.windSpeed)}`}
        unit="km/h"
        line1={`De ${dirDeg(hour.windDirection)} · ${fmt.hour(hour.time)}`}
        line2={`Rajadas ${fmt.kmh(hour.windGusts)} · ${hour.windSpeed == null ? '—' : Math.round(hour.windSpeed / 1.852)} nós`}
      />

      <StatGrid
        items={[
          { label: 'Máx. no dia', value: fmt.kmh(Math.max(0, ...speeds)), sub: `às ${peakHour(dayHours, (h) => h.windSpeed)}` },
          { label: 'Rajada máx.', value: fmt.kmh(Math.max(0, ...gusts)), sub: `às ${peakHour(dayHours, (h) => h.windGusts)}` },
          { label: 'Beaufort', value: bf.n, sub: bf.name },
          { label: 'Praia voltada', value: `${Math.round(spot.facing)}°`, sub: compass(spot.facing) },
        ]}
      />

      <DayChart
        label="Vento ao longo do dia"
        times={dayHours.map((h) => h.time)}
        min={0}
        max={top}
        selected={hour.time}
        cursorText={`${fmt.hour(hour.time)} · ${fmt.kmh(hour.windSpeed)}`}
        onSelect={onSelectHour}
        series={[
          { values: dayHours.map((h) => h.windSpeed), color: brand.deepGreen, area: true },
          { values: dayHours.map((h) => h.windGusts), color: brand.purple, dashed: true },
        ]}
      />

      <HourChips
        label="Vento hora a hora"
        selected={hour.time}
        onSelect={onSelectHour}
        hours={dayHours.map((h) => {
          const k = windKind(spot, h.windDirection, h.windSpeed)
          return {
            time: h.time,
            glyph: <DirArrow deg={h.windDirection} size={14} color={h.time === hour.time ? brand.sand : kindColor(k)} />,
            value: h.windSpeed == null ? '—' : `${Math.round(h.windSpeed)}`,
            sub: h.windGusts == null ? '' : `raj ${Math.round(h.windGusts)}`,
          }
        })}
      />

      <SummaryFooter
        title="Resumo do vento"
        lines={summary}
        note="Linha cheia: vento médio; tracejada: rajadas (km/h). Seta para onde o vento sopra; verde = terral ou fraco."
      />
    </CardShell>
  )
}
