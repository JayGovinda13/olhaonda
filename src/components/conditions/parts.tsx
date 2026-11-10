/**
 * Peças comuns dos cards Tempo, Vento e Maré. Os três seguem a mesma ordem:
 *   título + estado agora · 14 dias · agora · 4 indicadores · gráfico do dia · hora a hora · resumo · nota
 */
import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { dayLabel, fmt } from '../../lib/surf'
import { alpha, brand } from '../../theme'

/** rola a faixa para manter o item marcado (aria-pressed) no centro */
function useCenterSelected(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const c = ref.current
    const el = c?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (c && el) c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
  }, [dep])
  return ref
}

export function CardShell({ title, status, statusColor, children }: { title: string; status?: ReactNode; statusColor?: string; children: ReactNode }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1, minHeight: 32 }}>
        <Typography variant="h6">{title}</Typography>
        {status && (
          <Typography variant="body2" sx={{ fontWeight: 800, color: statusColor, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {status}
          </Typography>
        )}
      </Stack>
      {children}
    </Paper>
  )
}

export type DayChip = { date: string; glyph: ReactNode; value: string; sub: ReactNode; trend?: boolean }

/** faixa dos 14 dias (mesmo formato nos três cards) */
export function DayChips({ label, days, selectedDate, onSelect }: { label: string; days: DayChip[]; selectedDate: string; onSelect: (date: string) => void }) {
  const ref = useCenterSelected(selectedDate)
  return (
    <Box ref={ref} role="group" aria-label={label} sx={{ position: 'relative', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '62px', gap: 0.5, overflowX: 'auto', mt: 1.5, pb: 0.5 }}>
      {days.map((d, i) => {
        const active = d.date === selectedDate
        const { wd, dm } = dayLabel(d.date)
        return (
          <ButtonBase
            key={d.date}
            aria-pressed={active}
            aria-label={`${wd} ${dm}: ${d.value}`}
            onClick={() => onSelect(d.date)}
            sx={{
              flexDirection: 'column',
              height: 92,
              py: 0.75,
              borderRadius: '12px',
              bgcolor: active ? brand.purple : alpha(brand.purple, 0.04),
              color: active ? brand.sand : 'text.primary',
              border: d.trend && !active ? `1px dashed ${alpha(brand.purple, 0.3)}` : '1px solid transparent',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.75 }}>
              {i === 0 ? 'Hoje' : wd} {dm.slice(0, 2)}
            </Typography>
            <Box sx={{ height: 24, display: 'grid', placeItems: 'center', my: 0.25 }}>{d.glyph}</Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{d.value}</Typography>
            <Box sx={{ fontSize: 10, opacity: 0.7, height: 14, display: 'flex', alignItems: 'center' }}>{d.sub}</Box>
          </ButtonBase>
        )
      })}
    </Box>
  )
}

/** bloco "agora": ícone, valor grande e duas linhas */
export function NowBlock({ icon, tint, value, unit, line1, line2 }: { icon: ReactNode; tint: string; value: string; unit?: string; line1: ReactNode; line2: ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
      <Box sx={{ width: 60, height: 60, borderRadius: '18px', display: 'grid', placeItems: 'center', bgcolor: alpha(tint, 0.14), color: tint, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {value}
          {unit && (
            <Box component="span" sx={{ fontSize: 15, ml: 0.5, letterSpacing: 0 }}>
              {unit}
            </Box>
          )}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }} noWrap>
          {line1}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }} noWrap>
          {line2}
        </Typography>
      </Box>
    </Stack>
  )
}

export type Stat = { label: string; value: ReactNode; sub: ReactNode; tint?: string }

/** quatro indicadores em grade 2×2 (blocos do mesmo tamanho nos três cards) */
export function StatGrid({ items }: { items: Stat[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mt: 2 }}>
      {items.map((s, i) => (
        <Box key={i} sx={{ px: 1.5, py: 1, borderRadius: '12px', bgcolor: s.tint ? alpha(s.tint, 0.13) : alpha(brand.purple, 0.045), minWidth: 0 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', opacity: 0.65 }} noWrap>
            {s.label}
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25 }} noWrap>
            {s.value}
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }} noWrap>
            {s.sub}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

export type Series = {
  values: (number | null)[]
  color: string
  /** área preenchida sob a linha */
  area?: boolean
  dashed?: boolean
  /** barras em vez de linha */
  bars?: boolean
  /** escala própria [min, max]; padrão: a do gráfico */
  scale?: [number, number]
}

/**
 * Gráfico do dia (mesmo tamanho nos três cards). Arraste ou clique para escolher a hora;
 * setas do teclado também mudam a hora.
 */
export function DayChart({
  label,
  times,
  series,
  min,
  max,
  selected,
  cursorText,
  refLine,
  onSelect,
}: {
  label: string
  times: string[]
  series: Series[]
  min: number
  max: number
  selected: string
  cursorText: string
  refLine?: { value: number; text: string }
  onSelect: (time: string) => void
}) {
  const grad = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const W = 480
  const H = 150
  const PAD = 14
  const TOP = 34
  const BOTTOM = 24
  const n = times.length
  const x = (i: number) => PAD + (i / Math.max(1, n - 1)) * (W - PAD * 2)
  const yOf = (v: number, s: [number, number]) => TOP + (1 - (v - s[0]) / Math.max(1e-6, s[1] - s[0])) * (H - TOP - BOTTOM)
  const baseY = H - BOTTOM
  const selIdx = times.indexOf(selected)

  const smooth = (pts: [number, number][]) =>
    pts
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

  const pick = (clientX: number) => {
    const svg = svgRef.current
    if (!svg || !n) return
    const r = svg.getBoundingClientRect()
    const vx = ((clientX - r.left) / r.width) * W
    const i = Math.max(0, Math.min(n - 1, Math.round(((vx - PAD) / (W - PAD * 2)) * (n - 1))))
    if (times[i] !== selected) onSelect(times[i])
  }
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    pick(e.clientX)
  }
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging || e.pointerType === 'mouse') pick(e.clientX)
  }
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step || selIdx < 0) return
    e.preventDefault()
    onSelect(times[Math.max(0, Math.min(n - 1, selIdx + step))])
  }
  const labelX = selIdx >= 0 ? Math.max(64, Math.min(W - 64, x(selIdx))) : 0
  const main = series[0]
  const mainScale: [number, number] = main?.scale ?? [min, max]
  const cursorY = selIdx >= 0 && main?.values[selIdx] != null ? yOf(main.values[selIdx]!, mainScale) : null

  return (
    <Box
      component="svg"
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, n - 1)}
      aria-valuenow={selIdx}
      aria-valuetext={cursorText}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={onKey}
      sx={{
        width: '100%',
        height: 'auto',
        mt: 2,
        display: 'block',
        cursor: dragging ? 'grabbing' : 'ew-resize',
        touchAction: 'pan-y',
        userSelect: 'none',
        outline: 'none',
        borderRadius: '12px',
        '&:focus-visible': { boxShadow: `0 0 0 2px ${alpha(brand.purple, 0.4)}` },
      }}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={main?.color ?? brand.green} stopOpacity="0.35" />
          <stop offset="1" stopColor={main?.color ?? brand.green} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 6, 12, 18, n - 1].map((i, k) =>
        i >= 0 && i < n && (k < 4 || i > 19) ? (
          <g key={k}>
            <line x1={x(i)} x2={x(i)} y1={TOP - 6} y2={baseY} stroke={brand.purple} strokeOpacity="0.07" />
            <text x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i >= n - 1 ? 'end' : 'middle'} fontSize="14" fontWeight="700" fill={brand.purple} opacity="0.55">
              {fmt.hour(times[i])}
            </text>
          </g>
        ) : null,
      )}
      {refLine && refLine.value > min && refLine.value < max && (
        <g>
          <line x1={PAD} x2={W - PAD} y1={yOf(refLine.value, [min, max])} y2={yOf(refLine.value, [min, max])} stroke={brand.purple} strokeOpacity="0.25" strokeDasharray="2 4" />
          <text x={W - PAD} y={yOf(refLine.value, [min, max]) - 4} textAnchor="end" fontSize="13" fill={brand.purple} opacity="0.5">
            {refLine.text}
          </text>
        </g>
      )}
      {series.map((s, si) => {
        const sc = s.scale ?? [min, max]
        if (s.bars) {
          const bw = Math.max(3, ((W - PAD * 2) / Math.max(1, n)) * 0.55)
          return (
            <g key={si}>
              {s.values.map((v, i) =>
                v == null || v <= 0 ? null : (
                  <rect key={i} x={x(i) - bw / 2} y={yOf(v, sc)} width={bw} height={baseY - yOf(v, sc)} rx={2} fill={s.color} opacity={0.18} />
                ),
              )}
            </g>
          )
        }
        const pts = s.values.map((v, i) => (v == null ? null : ([x(i), yOf(v, sc)] as [number, number]))).filter((p): p is [number, number] => p != null)
        if (!pts.length) return null
        const d = smooth(pts)
        return (
          <g key={si}>
            {s.area && <path d={`${d} L${pts[pts.length - 1][0]} ${baseY} L${pts[0][0]} ${baseY} Z`} fill={`url(#${grad})`} />}
            <path d={d} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.5 : 2.5} strokeDasharray={s.dashed ? '4 4' : undefined} strokeLinejoin="round" opacity={s.dashed ? 0.6 : 1} />
          </g>
        )
      })}
      {selIdx >= 0 && (
        <g pointerEvents="none">
          <line x1={x(selIdx)} x2={x(selIdx)} y1={TOP - 4} y2={baseY} stroke={brand.purple} strokeWidth="1.5" opacity="0.55" />
          {cursorY != null && <circle cx={x(selIdx)} cy={cursorY} r={dragging ? 9 : 7} fill={brand.purple} stroke={brand.sand} strokeWidth="3" />}
          <rect x={labelX - 62} y={0} width="124" height="28" rx="14" fill={brand.purple} />
          <text x={labelX} y={19} textAnchor="middle" fontSize="15" fontWeight="800" fill={brand.sand}>
            {cursorText}
          </text>
        </g>
      )}
    </Box>
  )
}

export type HourChip = { time: string; glyph: ReactNode; value: string; sub: ReactNode }

/** faixa hora a hora (mesmo formato nos três cards) */
export function HourChips({ label, hours, selected, onSelect }: { label: string; hours: HourChip[]; selected: string; onSelect: (time: string) => void }) {
  const ref = useCenterSelected(selected)
  return (
    <Box ref={ref} role="group" aria-label={label} sx={{ position: 'relative', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '52px', gap: 0.5, overflowX: 'auto', mt: 1.5, pb: 0.5 }}>
      {hours.map((h) => {
        const active = h.time === selected
        return (
          <ButtonBase
            key={h.time}
            aria-pressed={active}
            onClick={() => onSelect(h.time)}
            sx={{ flexDirection: 'column', height: 80, py: 0.75, borderRadius: '10px', bgcolor: active ? brand.purple : alpha(brand.purple, 0.04), color: active ? brand.sand : 'text.primary' }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{fmt.hour(h.time)}</Typography>
            <Box sx={{ height: 20, display: 'grid', placeItems: 'center', my: 0.25 }}>{h.glyph}</Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{h.value}</Typography>
            <Box sx={{ fontSize: 10, opacity: 0.7, height: 14, display: 'flex', alignItems: 'center' }}>{h.sub}</Box>
          </ButtonBase>
        )
      })}
    </Box>
  )
}

/** resumo do dia (logo após o hora a hora, alinhado nos três cards) e nota de rodapé (no fim do card) */
export function SummaryFooter({ title, lines, note }: { title: string; lines: string[]; note?: ReactNode }) {
  return (
    <>
      {lines.length > 0 && (
        <Box sx={{ mt: 2, p: 1.75, borderRadius: '14px', bgcolor: alpha(brand.green, 0.09), border: `1px solid ${alpha(brand.green, 0.18)}` }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', opacity: 0.7, mb: 0.5 }}>{title}</Typography>
          {lines.map((l) => (
            <Typography key={l} variant="body2" sx={{ lineHeight: 1.5 }}>
              {l}
            </Typography>
          ))}
        </Box>
      )}
      {note && (
        <Typography variant="caption" component="div" sx={{ mt: 'auto', pt: 1.5, opacity: 0.6, lineHeight: 1.45 }}>
          {note}
        </Typography>
      )}
    </>
  )
}
