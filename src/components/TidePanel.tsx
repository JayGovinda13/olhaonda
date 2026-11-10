import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ArrowDown, ArrowUp } from 'iconoir-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { extremes, m1, tidePortFor } from '../data/tidePorts'
import { moonInfo } from '../lib/moon'
import { dayLabel, fmt } from '../lib/surf'
import { MoonIcon } from './MoonIcon'
import { brand } from '../theme'

export function TidePanel({
  spot,
  hours: rawHours,
  allHours,
  selected,
  onSelect,
  onSelectDay,
}: {
  spot: Spot
  /** horas do dia escolhido */
  hours: HourPoint[]
  /** todas as horas da previsão (14 dias), para a faixa de dias */
  allHours: HourPoint[]
  selected: string
  onSelect: (time: string) => void
  onSelectDay: (date: string) => void
}) {
  const moon = moonInfo(new Date(`${(rawHours[0]?.time ?? selected).slice(0, 10)}T12:00:00-03:00`))
  const modeled = rawHours.some((h) => h.tideModeled)
  // Converte do nível médio (modelo) para o nível de redução da Marinha: altura = nível + Z0
  const port = tidePortFor(spot)
  const hours = rawHours.map((h) => ({ ...h, seaLevel: h.seaLevel == null ? null : h.seaLevel + port.z0 }))
  const grad = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const levels = hours.map((h) => h.seaLevel)
  const valid = levels.filter((v): v is number => v != null)

  const W = 480
  const H = 170
  const PAD_X = 16
  const TOP = 34 // espaço para o rótulo do cursor
  const BOTTOM = 26 // espaço para as horas
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const span = Math.max(max - min, 0.2)
  const x = (i: number) => PAD_X + (i / Math.max(1, hours.length - 1)) * (W - PAD_X * 2)
  const y = (v: number) => TOP + (1 - (v - min) / span) * (H - TOP - BOTTOM)

  const pts = levels.map((v, i) => (v == null ? null : ([x(i), y(v)] as const))).filter(Boolean) as [number, number][]
  // curva suave (Catmull-Rom -> Bézier) entre os pontos horários
  const line = pts
    .map(([px, py], i) => {
      if (i === 0) return `M${px.toFixed(1)} ${py.toFixed(1)}`
      const p0 = pts[i - 2] ?? pts[i - 1]
      const p1 = pts[i - 1]
      const p3 = pts[i + 1] ?? [px, py]
      const c1 = [p1[0] + (px - p0[0]) / 6, p1[1] + (py - p0[1]) / 6]
      const c2 = [px - (p3[0] - p1[0]) / 6, py - (p3[1] - p1[1]) / 6]
      return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)}`
    })
    .join(' ')
  const baseY = H - BOTTOM
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]} ${baseY} L${pts[0][0]} ${baseY} Z` : ''
  const meanY = port.z0 > min && port.z0 < max ? y(port.z0) : null

  const selIdx = hours.findIndex((h) => h.time === selected)
  const sel = selIdx >= 0 ? hours[selIdx].seaLevel : null
  const ext = extremes(hours)

  const trendAt = (i: number) => {
    const a = hours[i]?.seaLevel
    const b = hours[i + 1]?.seaLevel ?? null
    const prev = hours[i - 1]?.seaLevel ?? null
    if (a == null) return null
    if (b != null) return b > a ? 'up' : 'down'
    if (prev != null) return a > prev ? 'up' : 'down'
    return null
  }
  const trend = selIdx >= 0 ? trendAt(selIdx) : null

  // cursor: converte a posição do ponteiro na hora mais próxima
  const pickFromPointer = (clientX: number) => {
    const svg = svgRef.current
    if (!svg || !hours.length) return
    const r = svg.getBoundingClientRect()
    const vx = ((clientX - r.left) / r.width) * W
    const i = Math.round(((vx - PAD_X) / (W - PAD_X * 2)) * (hours.length - 1))
    const idx = Math.max(0, Math.min(hours.length - 1, i))
    if (hours[idx].time !== selected) onSelect(hours[idx].time)
  }
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    pickFromPointer(e.clientX)
  }
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging || e.pointerType === 'mouse') pickFromPointer(e.clientX)
  }
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step || selIdx < 0) return
    e.preventDefault()
    const next = hours[Math.max(0, Math.min(hours.length - 1, selIdx + step))]
    onSelect(next.time)
  }

  // mantém a hora selecionada visível na tabela horária
  useEffect(() => {
    const box = listRef.current
    const el = box?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [selected])

  // rótulo do cursor não pode sair do gráfico
  const labelX = selIdx >= 0 ? Math.max(62, Math.min(W - 62, x(selIdx))) : 0

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="h6">Maré</Typography>
        {trend && sel != null && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: trend === 'up' ? brand.green : brand.plum }}>
            {trend === 'up' ? <ArrowUp width={16} height={16} /> : <ArrowDown width={16} height={16} />}
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {trend === 'up' ? 'enchendo' : 'secando'} · {m1(sel)}
            </Typography>
          </Stack>
        )}
      </Stack>

      <TideDays allHours={allHours} z0={tidePortFor(spot).z0} selectedDate={selected.slice(0, 10)} onSelectDay={onSelectDay} />

      {valid.length ? (
        <Box
          component="svg"
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="slider"
          tabIndex={0}
          aria-label="Hora no gráfico de maré"
          aria-valuemin={0}
          aria-valuemax={23}
          aria-valuenow={selIdx}
          aria-valuetext={sel != null ? `${fmt.hour(selected)}, ${m1(sel)}` : undefined}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={onKey}
          sx={{
            width: '100%',
            height: 'auto',
            mt: 1.5,
            display: 'block',
            cursor: dragging ? 'grabbing' : 'ew-resize',
            touchAction: 'pan-y', // arrastar na horizontal move o cursor; na vertical rola a página
            userSelect: 'none',
            outline: 'none',
            borderRadius: '12px',
            '&:focus-visible': { boxShadow: `0 0 0 2px ${alpha(brand.purple, 0.4)}` },
          }}
        >
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={brand.green} stopOpacity="0.38" />
              <stop offset="1" stopColor={brand.green} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* grade das horas */}
          {[0, 6, 12, 18, 23].map((hIdx) =>
            hIdx < hours.length ? (
              <g key={hIdx}>
                <line x1={x(hIdx)} x2={x(hIdx)} y1={TOP - 6} y2={baseY} stroke={brand.purple} strokeOpacity="0.07" />
                <text x={x(hIdx)} y={H - 6} textAnchor={hIdx === 0 ? 'start' : hIdx >= hours.length - 1 ? 'end' : 'middle'} fontSize="14" fontWeight="700" fill={brand.purple} opacity="0.55">
                  {fmt.hour(hours[hIdx].time)}
                </text>
              </g>
            ) : null,
          )}
          {meanY != null && (
            <g>
              <line x1={PAD_X} x2={W - PAD_X} y1={meanY} y2={meanY} stroke={brand.purple} strokeOpacity="0.25" strokeDasharray="2 4" />
              <text x={W - PAD_X} y={meanY - 4} textAnchor="end" fontSize="13" fill={brand.purple} opacity="0.5">
                nível médio
              </text>
            </g>
          )}
          <path d={area} fill={`url(#${grad})`} />
          <path d={line} fill="none" stroke={brand.deepGreen} strokeWidth="2.5" strokeLinejoin="round" />
          {pts.map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r="2" fill={brand.deepGreen} opacity="0.45" />
          ))}
          {selIdx >= 0 && sel != null && (
            <g pointerEvents="none">
              <line x1={x(selIdx)} x2={x(selIdx)} y1={TOP - 4} y2={baseY} stroke={brand.purple} strokeWidth="1.5" opacity="0.55" />
              <circle cx={x(selIdx)} cy={y(sel)} r={dragging ? 9 : 7} fill={brand.purple} stroke={brand.sand} strokeWidth="3" />
              <rect x={labelX - 60} y={0} width="120" height="28" rx="14" fill={brand.purple} />
              <text x={labelX} y={19} textAnchor="middle" fontSize="15" fontWeight="800" fill={brand.sand}>
                {fmt.hour(selected)} · {sel.toFixed(1).replace('.', ',')} m
              </text>
            </g>
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
          Sem dados de maré para este ponto.
        </Typography>
      )}

      {/* preamares e baixa-mares: altura em cima, blocos ocupando a largura do card */}
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, ext.length)}, minmax(0, 1fr))`, gap: 1, mt: 1.5 }}>
        {ext.map((e) => (
          <Box
            key={e.time}
            sx={{
              px: 1,
              py: 1,
              borderRadius: '12px',
              textAlign: 'center',
              bgcolor: e.kind === 'alta' ? 'rgba(47,174,123,.14)' : 'rgba(122,46,110,.1)',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>{e.kind}</Typography>
            <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{m1(e.level)}</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{fmt.hour(e.time)}</Typography>
          </Box>
        ))}
      </Box>

      {/* tabela de hora em hora */}
      <Box
        ref={listRef}
        role="group"
        aria-label="Maré de hora em hora"
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: '54px',
          gap: 0.5,
          overflowX: 'auto',
          mt: 2,
          pb: 0.5,
          position: 'relative',
        }}
      >
        {hours.map((h, i) => {
          const active = h.time === selected
          const t = trendAt(i)
          return (
            <ButtonBase
              key={h.time}
              aria-pressed={active}
              onClick={() => onSelect(h.time)}
              sx={{
                flexDirection: 'column',
                py: 0.75,
                borderRadius: '10px',
                bgcolor: active ? brand.purple : alpha(brand.purple, 0.04),
                color: active ? brand.sand : 'text.primary',
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{fmt.hour(h.time)}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                {h.seaLevel == null ? '—' : h.seaLevel.toFixed(1).replace('.', ',')}
              </Typography>
              <Box sx={{ display: 'flex', color: active ? brand.sand : t === 'up' ? brand.green : brand.plum }}>
                {t === 'up' ? <ArrowUp width={12} height={12} /> : t === 'down' ? <ArrowDown width={12} height={12} /> : null}
              </Box>
            </ButtonBase>
          )
        })}
      </Box>

      {/* fase da lua: lua nova e cheia = marés de sizígia (mais amplitude); quartos = quadratura */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <MoonIcon phase={moon.phase} size={44} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Lua {moon.name.toLowerCase()} · {Math.round(moon.illumination * 100)}%
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            {moon.tideKind === 'sizígia'
              ? 'Maré de sizígia: altas mais altas e baixas mais baixas'
              : moon.tideKind === 'quadratura'
                ? 'Maré de quadratura: pouca diferença entre alta e baixa'
                : 'Maré intermediária'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {moon.next
              .slice(0, 2)
              .map((n) => `${n.name.toLowerCase()} ${n.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })}`)
              .join(' · ')}
          </Typography>
        </Box>
      </Stack>
      {modeled && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: brand.plum, fontWeight: 700 }}>
          Maré deste dia calculada por análise harmônica (além do horizonte do modelo): erro típico de ~10 cm.
        </Typography>
      )}
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.6 }}>
        Padrão Marinha (DHN): alturas em metros acima do nível de redução, porto de referência {port.name}, nível
        médio a {port.z0.toFixed(2).replace('.', ',')} m{port.verified ? '' : ' (estimado)'}. Arraste no gráfico para mudar a
        hora.
      </Typography>
    </Paper>
  )
}

/**
 * Os 14 dias de maré numa faixa que rola de lado: mini curva do dia, amplitude (alta − baixa)
 * e a lua. Dá para ver de relance a semana de sizígia (amplitude grande) e a de quadratura.
 */
function TideDays({
  allHours,
  z0,
  selectedDate,
  onSelectDay,
}: {
  allHours: HourPoint[]
  z0: number
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
  const all = allHours.map((h) => h.seaLevel).filter((v): v is number => v != null)
  if (!all.length) return null
  const lo = Math.min(...all) + z0
  const hi = Math.max(...all) + z0
  const SW = 44
  const SH = 18

  return (
    <Box
      ref={ref}
      role="group"
      aria-label="Maré dos 14 dias"
      sx={{ position: 'relative', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '64px', gap: 0.5, overflowX: 'auto', mt: 1.5, pb: 0.5 }}
    >
      {[...byDay.entries()].map(([date, hs], i) => {
        const lv = hs.map((h) => (h.seaLevel == null ? null : h.seaLevel + z0))
        const ok = lv.filter((v): v is number => v != null)
        const amp = ok.length ? Math.max(...ok) - Math.min(...ok) : null
        const pts = lv
          .map((v, k) => (v == null ? null : `${((k / Math.max(1, lv.length - 1)) * SW).toFixed(1)},${(SH - ((v - lo) / (hi - lo || 1)) * SH).toFixed(1)}`))
          .filter(Boolean)
          .join(' ')
        const moon = moonInfo(new Date(`${date}T12:00:00-03:00`))
        const active = date === selectedDate
        const { wd, dm } = dayLabel(date)
        return (
          <ButtonBase
            key={date}
            aria-pressed={active}
            aria-label={`${wd} ${dm}: amplitude ${amp == null ? '—' : m1(amp)}, lua ${moon.name.toLowerCase()}`}
            onClick={() => onSelectDay(date)}
            sx={{
              flexDirection: 'column',
              py: 0.75,
              borderRadius: '12px',
              bgcolor: active ? brand.purple : alpha(brand.purple, 0.04),
              color: active ? brand.sand : 'text.primary',
              border: hs.some((h) => h.tideModeled) && !active ? `1px dashed ${alpha(brand.purple, 0.3)}` : '1px solid transparent',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.75 }}>
              {i === 0 ? 'Hoje' : wd} {dm.slice(0, 2)}
            </Typography>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} aria-hidden style={{ margin: '4px 0' }}>
              <polyline points={pts} fill="none" stroke={active ? brand.sand : brand.deepGreen} strokeWidth={1.6} strokeLinejoin="round" />
            </svg>
            <Typography sx={{ fontSize: 12, fontWeight: 800, lineHeight: 1.1 }}>{amp == null ? '—' : m1(amp)}</Typography>
            <Box sx={{ mt: 0.5, display: 'flex' }}>
              <MoonIcon phase={moon.phase} size={14} />
            </Box>
          </ButtonBase>
        )
      })}
    </Box>
  )
}
