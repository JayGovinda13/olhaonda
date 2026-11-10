import { useMemo } from 'react'
import type { DayWeather, HourPoint } from '../api/openMeteo'
import { weatherSummary } from '../lib/dayText'
import { fmt, weatherLabel } from '../lib/surf'
import { brand } from '../theme'
import { CardShell, DayChart, DayChips, HourChips, NowBlock, StatGrid, SummaryFooter } from './conditions/parts'
import { WeatherIcon } from './WeatherIcon'

function uvLabel(uv: number | null) {
  if (uv == null) return '—'
  const v = Math.round(uv)
  if (v < 3) return 'baixo'
  if (v < 6) return 'moderado'
  if (v < 8) return 'alto'
  if (v < 11) return 'muito alto'
  return 'extremo'
}

/** Tempo: céu, temperatura, chuva, UV e sol. */
export function WeatherPanel({
  days,
  hour,
  dayHours,
  onSelectDay,
  onSelectHour,
}: {
  days: DayWeather[]
  hour: HourPoint
  /** horas do dia escolhido */
  dayHours: HourPoint[]
  onSelectDay: (date: string) => void
  onSelectHour: (time: string) => void
}) {
  const date = hour.time.slice(0, 10)
  const day = days.find((d) => d.date === date) ?? days[0]
  const temps = dayHours.map((h) => h.airTemp).filter((v): v is number => v != null)
  const tMin = Math.floor(Math.min(...temps, 30) - 1)
  const tMax = Math.ceil(Math.max(...temps, 0) + 1)
  const summary = useMemo(() => weatherSummary(dayHours), [dayHours])
  if (!day) return null

  return (
    <CardShell title="Tempo" status={weatherLabel(hour.weatherCode)} statusColor={brand.deepGreen}>
      <DayChips
        label="Tempo dos 14 dias"
        selectedDate={date}
        onSelect={onSelectDay}
        days={days.map((d) => ({
          date: d.date,
          glyph: <WeatherIcon code={d.weatherCode} size={22} />,
          value: d.tMax == null ? '—' : `${Math.round(d.tMax)}°`,
          sub: d.tMin == null ? '' : `${Math.round(d.tMin)}°`,
        }))}
      />

      <NowBlock
        icon={<WeatherIcon code={hour.weatherCode} size={32} />}
        tint={brand.deepGreen}
        value={hour.airTemp == null ? '—' : `${Math.round(hour.airTemp)}`}
        unit="°C"
        line1={`${weatherLabel(hour.weatherCode)} · ${fmt.hour(hour.time)}`}
        line2={`Máx ${fmt.c(day.tMax)} · mín ${fmt.c(day.tMin)}`}
      />

      <StatGrid
        items={[
          { label: 'Chuva', value: `${hour.rainChance ?? 0}%`, sub: `${(day.rainSum ?? 0).toFixed(1).replace('.', ',')} mm no dia` },
          { label: 'Índice UV', value: day.uvMax == null ? '—' : Math.round(day.uvMax), sub: uvLabel(day.uvMax) },
          { label: 'Nuvens', value: hour.cloudCover == null ? '—' : `${Math.round(hour.cloudCover)}%`, sub: `às ${fmt.hour(hour.time)}` },
          { label: 'Sol', value: day.sunrise ? fmt.hour(day.sunrise) : '—', sub: day.sunset ? `pôr às ${fmt.hour(day.sunset)}` : '' },
        ]}
      />

      <DayChart
        label="Temperatura e chuva ao longo do dia"
        times={dayHours.map((h) => h.time)}
        min={tMin}
        max={tMax}
        selected={hour.time}
        cursorText={`${fmt.hour(hour.time)} · ${fmt.c(hour.airTemp)}`}
        onSelect={onSelectHour}
        series={[
          // a linha principal vem primeiro (o cursor acompanha ela); as barras ficam atrás no desenho
          { values: dayHours.map((h) => h.airTemp), color: brand.deepGreen, area: true },
          { values: dayHours.map((h) => h.rainChance), color: brand.plum, bars: true, scale: [0, 200] },
        ]}
      />

      <HourChips
        label="Tempo hora a hora"
        selected={hour.time}
        onSelect={onSelectHour}
        hours={dayHours.map((h) => ({
          time: h.time,
          glyph: <WeatherIcon code={h.weatherCode} size={18} />,
          value: h.airTemp == null ? '—' : `${Math.round(h.airTemp)}°`,
          sub: `${h.rainChance ?? 0}%`,
        }))}
      />

      <SummaryFooter title="Resumo do tempo" lines={summary} note="Linha: temperatura (°C). Barras: chance de chuva (%). Arraste no gráfico para mudar a hora." />
    </CardShell>
  )
}
