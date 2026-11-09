import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGrid, regionFor, WIDE_BBOX, type Bbox, type Grid } from '../../api/grid'
import type { HourPoint } from '../../api/openMeteo'
import type { Spot } from '../../data/spots'
import { useLocalState } from '../../hooks/useLocalState'
import { FIELDS, legendGradient, type FieldDef, type FieldId } from '../../lib/fields'
import { dirDeg, ENERGY_GRADIENT } from '../../lib/surf'
import { brand } from '../../theme'
import { FieldMap } from './FieldMap'
import { COMPONENTS } from './components'
import { SpectralView } from './SpectralView'
import { Timeline } from './Timeline'

type GridState = { key: string; grid?: Grid; error?: string }

/** Carrega a grade de uma região (com cache) só quando `enabled`. */
function useGrid(bbox: Bbox, enabled: boolean, nx: number, ny: number) {
  const key = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`
  const [state, setState] = useState<GridState | null>(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    fetchGrid(bbox, nx, ny)
      .then((grid) => alive && setState({ key, grid }))
      .catch((e: Error) => alive && setState({ key, error: e.message }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, nx, ny])
  const cur = state?.key === key ? state : null
  return { grid: cur?.grid ?? null, error: cur?.error ?? null, loading: enabled && !cur }
}

function Legend({ def }: { def: FieldDef }) {
  const lo = def.stops[0][0]
  const hi = def.stops[def.stops.length - 1][0]
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: 46, flexShrink: 0 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 800, opacity: 0.7 }}>{def.unit}</Typography>
      <Box sx={{ position: 'relative', flex: 1, width: 18, borderRadius: '9px', background: legendGradient(def), minHeight: 200 }}>
        {def.ticks.map((t) => (
          <Typography
            key={t}
            sx={{
              position: 'absolute',
              left: 22,
              top: `${((hi - t) / (hi - lo)) * 100}%`,
              transform: 'translateY(-50%)',
              fontSize: 10,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            {def.fmt ? def.fmt(t) : t}
          </Typography>
        ))}
      </Box>
      {def.id === 'tempo' && (
        <Box sx={{ mt: 0.5, textAlign: 'center' }}>
          <Box sx={{ width: 18, height: 10, borderRadius: '3px', bgcolor: '#2F6FD6', mx: 'auto' }} />
          <Typography sx={{ fontSize: 9, fontWeight: 800 }}>chuva</Typography>
        </Box>
      )}
    </Box>
  )
}

const MAP_H = { xs: 300, md: 380 }

/** Painel "O pico": mapas de campos (altura, vento, tempo…) e visão espectral, com linha do tempo. */
export function PicoPanel({
  spot,
  hours,
  selected,
  onSelect,
}: {
  spot: Spot
  hours: HourPoint[]
  selected: HourPoint
  onSelect: (time: string) => void
}) {
  const [fieldId, setFieldId] = useLocalState<FieldId>('olhaonda:field', 'altura')
  const [right, setRight] = useLocalState<'espectral' | 'amplo'>('olhaonda:mapRight', 'espectral')
  const def = FIELDS.find((f) => f.id === fieldId) ?? FIELDS[0]
  const region = useMemo(() => regionFor(spot.lat, spot.lon), [spot.lat, spot.lon])

  const regional = useGrid(region, true, 9, 9)
  const wide = useGrid(WIDE_BBOX, right === 'amplo', 10, 10)

  const times = useMemo(() => hours.map((h) => h.time), [hours])
  const index = Math.max(0, times.indexOf(selected.time))
  const pick = useCallback((i: number) => times[i] && onSelect(times[i]), [times, onSelect])
  const gridIndex = (g: Grid | null) => (g ? Math.max(0, g.times.indexOf(selected.time)) : 0)

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}>
        <Box>
          <Typography variant="h6">O pico</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {def.title} · janela da praia {dirDeg(spot.facing)}
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={right}
          onChange={(_, v) => v && setRight(v)}
          sx={{ '& .MuiToggleButton-root': { px: 1.5, fontWeight: 800, textTransform: 'none' } }}
        >
          <ToggleButton value="espectral">Espectral</ToggleButton>
          <ToggleButton value="amplo">Mapa amplo</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* abas dos campos */}
      <Box
        role="tablist"
        aria-label="Campo do mapa"
        sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', borderBottom: `2px solid ${alpha(brand.purple, 0.12)}`, mb: 2 }}
      >
        {FIELDS.map((f) => {
          const on = f.id === def.id
          return (
            <Box
              key={f.id}
              component="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFieldId(f.id)}
              sx={{
                border: 0,
                cursor: 'pointer',
                font: 'inherit',
                fontWeight: 800,
                fontSize: 14,
                px: 1.75,
                py: 1,
                borderRadius: '10px 10px 0 0',
                bgcolor: on ? brand.purple : 'transparent',
                color: on ? brand.sand : brand.purple,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: on ? brand.purple : alpha(brand.purple, 0.06) },
              }}
            >
              {f.tab}
            </Box>
          )
        })}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) auto minmax(0,1fr)' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <FieldMap
          grid={regional.grid}
          bbox={region}
          def={def}
          timeIndex={gridIndex(regional.grid)}
          spot={spot}
          loading={regional.loading}
          error={regional.error}
          height={MAP_H}
          label="Região"
        />
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', height: MAP_H.md }}>
          <Legend def={def} />
        </Box>
        {/* celular: legenda horizontal compacta */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mt: -1 }}>
          <Box sx={{ height: 10, borderRadius: 5, background: legendGradient(def).replace('180deg', '270deg') }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
            {[def.ticks[0], def.ticks[Math.floor(def.ticks.length / 2)], def.ticks[def.ticks.length - 1]].map((t) => (
              <Typography key={t} sx={{ fontSize: 10, fontWeight: 800 }}>
                {def.fmt ? def.fmt(t) : t} {t === def.ticks[def.ticks.length - 1] ? def.unit : ''}
              </Typography>
            ))}
          </Box>
        </Box>
        {right === 'amplo' ? (
          <FieldMap
            grid={wide.grid}
            bbox={WIDE_BBOX}
            def={def}
            timeIndex={gridIndex(wide.grid)}
            spot={spot}
            loading={wide.loading}
            error={wide.error}
            height={MAP_H}
            label="Brasil"
          />
        ) : (
          <Box>
            <SpectralView spot={spot} hour={selected} height={MAP_H} />
          </Box>
        )}
      </Box>

      {right === 'espectral' && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2, mt: 1.5, alignItems: 'center' }}>
          {COMPONENTS.map((c) => (
            <Stack key={c.key} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `12px solid ${c.stroke}` }} />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {c.label}
              </Typography>
            </Stack>
          ))}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: { md: 'auto' } }}>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              Força
            </Typography>
            <Box sx={{ width: 120, height: 8, borderRadius: 4, background: ENERGY_GRADIENT }} />
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              fraca → pesada
            </Typography>
          </Stack>
        </Stack>
      )}

      <Timeline times={times} index={index} onChange={pick} />
    </Paper>
  )
}
