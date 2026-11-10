import { ArrowDown, ArrowUp } from 'iconoir-react'
import { useMemo } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { extremes, m1, tidePortFor } from '../data/tidePorts'
import { moonInfo } from '../lib/moon'
import { fmt } from '../lib/surf'
import { brand } from '../theme'
import { CardShell, DayChart, DayChips, HourChips, NowBlock, StatGrid, SummaryFooter, type Stat } from './conditions/parts'
import { MoonIcon } from './MoonIcon'

const ddmm = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })

/** mini curva da maré do dia (faixa dos 14 dias) */
function Spark({ levels, lo, hi }: { levels: (number | null)[]; lo: number; hi: number }) {
  const W = 44
  const H = 18
  const pts = levels
    .map((v, k) => (v == null ? null : `${((k / Math.max(1, levels.length - 1)) * W).toFixed(1)},${(H - ((v - lo) / (hi - lo || 1)) * H).toFixed(1)}`))
    .filter(Boolean)
    .join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}

/** Maré no padrão da Marinha: altura acima do nível de redução, preamares/baixa-mares e lua. */
export function TidePanel({
  spot,
  hour,
  dayHours: rawHours,
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
  // nível médio (modelo) -> nível de redução da Marinha: altura = nível + Z0
  const port = tidePortFor(spot)
  const z0 = port.z0
  const hours = useMemo(() => rawHours.map((h) => ({ ...h, seaLevel: h.seaLevel == null ? null : h.seaLevel + z0 })), [rawHours, z0])
  const date = hour.time.slice(0, 10)
  const moon = moonInfo(new Date(`${date}T12:00:00-03:00`))
  const modeled = rawHours.some((h) => h.tideModeled)
  const ext = extremes(hours)
  const valid = hours.map((h) => h.seaLevel).filter((v): v is number => v != null)
  const lo = Math.min(...valid)
  const hi = Math.max(...valid)

  const idx = hours.findIndex((h) => h.time === hour.time)
  const level = idx >= 0 ? hours[idx].seaLevel : null
  const trendAt = (i: number) => {
    const a = hours[i]?.seaLevel
    const b = hours[i + 1]?.seaLevel ?? null
    const p = hours[i - 1]?.seaLevel ?? null
    if (a == null) return null
    if (b != null) return b > a ? 'up' : 'down'
    if (p != null) return a > p ? 'up' : 'down'
    return null
  }
  const trend = idx >= 0 ? trendAt(idx) : null
  const tint = trend === 'down' ? brand.plum : brand.green

  // 14 dias
  const days = useMemo(() => {
    const m = new Map<string, HourPoint[]>()
    for (const h of allHours) {
      const d = h.time.slice(0, 10)
      if (!m.has(d)) m.set(d, [])
      m.get(d)!.push(h)
    }
    const all = allHours.map((h) => h.seaLevel).filter((v): v is number => v != null)
    const aLo = Math.min(...all) + z0
    const aHi = Math.max(...all) + z0
    return [...m.entries()].map(([d, hs]) => {
      const lv = hs.map((h) => (h.seaLevel == null ? null : h.seaLevel + z0))
      const ok = lv.filter((v): v is number => v != null)
      const amp = ok.length ? Math.max(...ok) - Math.min(...ok) : null
      return {
        date: d,
        trend: hs.some((h) => h.tideModeled),
        glyph: <Spark levels={lv} lo={aLo} hi={aHi} />,
        value: amp == null ? '—' : m1(amp),
        sub: <MoonIcon phase={moonInfo(new Date(`${d}T12:00:00-03:00`)).phase} size={12} />,
      }
    })
  }, [allHours, z0])

  // indicadores: preamares e baixa-mares do dia (até 4); se forem 3, a amplitude completa a grade
  const stats: Stat[] = ext.slice(0, 4).map((e) => ({
    label: e.kind === 'alta' ? 'Alta' : 'Baixa',
    value: m1(e.level),
    sub: fmt.hour(e.time),
    tint: e.kind === 'alta' ? brand.green : brand.plum,
  }))
  if (stats.length < 4 && valid.length) stats.push({ label: 'Amplitude', value: m1(hi - lo), sub: 'alta − baixa' })
  while (stats.length < 4) stats.push({ label: '—', value: '—', sub: '' })

  const summary = [
    moon.tideKind === 'sizígia'
      ? 'Maré de sizígia: altas mais altas e baixas mais baixas.'
      : moon.tideKind === 'quadratura'
        ? 'Maré de quadratura: pouca diferença entre alta e baixa.'
        : 'Maré intermediária entre sizígia e quadratura.',
    `Amplitude do dia: ${valid.length ? m1(hi - lo) : '—'}.`,
    `Próximas luas: ${moon.next
      .slice(0, 2)
      .map((n) => `${n.name.toLowerCase()} ${ddmm(n.date)}`)
      .join(', ')}.`,
  ]
  if (modeled) summary.push('Maré deste dia calculada por análise harmônica (erro típico de ~10 cm).')

  return (
    <CardShell
      title="Maré"
      statusColor={tint}
      status={
        trend && level != null ? (
          <>
            {trend === 'up' ? <ArrowUp width={16} height={16} /> : <ArrowDown width={16} height={16} />}
            {trend === 'up' ? 'enchendo' : 'secando'} · {m1(level)}
          </>
        ) : undefined
      }
    >
      <DayChips label="Maré dos 14 dias" selectedDate={date} onSelect={onSelectDay} days={days} />

      <NowBlock
        icon={trend === 'down' ? <ArrowDown width={30} height={30} /> : <ArrowUp width={30} height={30} />}
        tint={tint}
        value={level == null ? '—' : level.toFixed(1).replace('.', ',')}
        unit="m"
        line1={`${trend === 'down' ? 'Secando' : 'Enchendo'} · ${fmt.hour(hour.time)}`}
        line2={
          <>
            <MoonIcon phase={moon.phase} size={12} /> Lua {moon.name.toLowerCase()} · {Math.round(moon.illumination * 100)}%
          </>
        }
      />

      <StatGrid items={stats} />

      {valid.length ? (
        <DayChart
          label="Maré ao longo do dia"
          times={hours.map((h) => h.time)}
          min={lo - 0.1}
          max={hi + 0.1}
          selected={hour.time}
          cursorText={`${fmt.hour(hour.time)} · ${level == null ? '—' : m1(level)}`}
          refLine={{ value: z0, text: 'nível médio' }}
          onSelect={onSelectHour}
          series={[{ values: hours.map((h) => h.seaLevel), color: brand.deepGreen, area: true }]}
        />
      ) : null}

      <HourChips
        label="Maré hora a hora"
        selected={hour.time}
        onSelect={onSelectHour}
        hours={hours.map((h, i) => {
          const t = trendAt(i)
          const color = h.time === hour.time ? brand.sand : t === 'up' ? brand.green : brand.plum
          return {
            time: h.time,
            glyph: t === 'up' ? <ArrowUp width={14} height={14} color={color} /> : t === 'down' ? <ArrowDown width={14} height={14} color={color} /> : null,
            value: h.seaLevel == null ? '—' : h.seaLevel.toFixed(1).replace('.', ','),
            sub: 'm',
          }
        })}
      />

      <SummaryFooter
        title="Resumo da maré"
        lines={summary}
        note={`Padrão Marinha (DHN): metros acima do nível de redução, porto de referência ${port.name}, nível médio a ${z0
          .toFixed(2)
          .replace('.', ',')} m${port.verified ? '' : ' (estimado)'}. Arraste no gráfico para mudar a hora.`}
      />
    </CardShell>
  )
}
