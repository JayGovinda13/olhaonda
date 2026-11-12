import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { SeaWaves, Wind } from 'iconoir-react'
import { useCallback, useMemo } from 'react'
import type { HourPoint } from '../../api/openMeteo'
import type { Spot } from '../../data/spots'
import { useLocalState } from '../../hooks/useLocalState'
import { compass, dirDeg, energyColor, fmt, trainEnergy, WIND_LABEL, windKind } from '../../lib/surf'
import { brand } from '../../theme'
import { SpotDetailMap, type FlowMode } from '../SpotDetailMap'
import { surfEstimate } from '../../lib/breaking'
import { Timeline } from './Timeline'

const f1 = (v: number) => v.toFixed(1).replace('.', ',')


function Chip({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
      <Typography variant="body2" noWrap>
        <Box component="span" sx={{ fontWeight: 800 }}>
          {label}
        </Box>{' '}
        <Box component="span" sx={{ opacity: 0.75 }}>
          {value}
        </Box>
      </Typography>
    </Stack>
  )
}

/**
 * "O pico": um mapa só, com duas camadas que se alternam (ondas ou vento), a linha das
 * componentes do mar logo abaixo e a linha do tempo. Simples de ler, sem grades nem abas.
 */
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
  const [mode, setMode] = useLocalState<FlowMode>('olhaonda:flow', 'ondas')
  const times = useMemo(() => hours.map((h) => h.time), [hours])
  const index = Math.max(0, times.indexOf(selected.time))
  const pick = useCallback((i: number) => times[i] && onSelect(times[i]), [times, onSelect])

  const h = selected
  const comps = [
    { label: 'Swell 1', h: h.swellHeight, d: h.swellDirection, t: h.swellPeakPeriod ?? h.swellPeriod },
    { label: 'Swell 2', h: h.swell2Height, d: h.swell2Direction, t: h.swell2Period },
    { label: 'Mar de vento', h: h.windWaveHeight, d: h.windWaveDirection, t: h.windWavePeriod },
  ].filter((c) => c.h != null && c.d != null && c.t != null && c.h >= 0.05)
  const wk = windKind(spot, h.windDirection, h.windSpeed)
  // quanto cada trem de ondas chega quebrando neste pico
  const atBeach = new Map((surfEstimate(spot, h)?.trains ?? []).map((t) => [t.label, t.hb]))

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">O pico</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Praia voltada para {dirDeg(spot.facing)}
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, v) => v && setMode(v)}
          aria-label="Camada do mapa"
          sx={{ flexShrink: 0, '& .MuiToggleButton-root': { px: 1.5, gap: 0.75, fontWeight: 800, textTransform: 'none' } }}
        >
          <ToggleButton value="ondas">
            <SeaWaves width={16} height={16} /> Ondas
          </ToggleButton>
          <ToggleButton value="vento">
            <Wind width={16} height={16} /> Vento
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <SpotDetailMap spot={spot} hour={selected} mode={mode} />

      {/* componentes do mar e vento da hora escolhida */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' },
          gap: { xs: 0.75, md: 2 },
          mt: 1.5,
        }}
      >
        {comps.map((c) => (
          <Chip
            key={c.label}
            label={c.label}
            dot={energyColor(trainEnergy(c.h!, c.t!))}
            value={`${Math.round(c.d!)}° ${compass(c.d)} · ${f1(c.h!)} m · ${f1(c.t!)} s → ${f1(atBeach.get(c.label) ?? 0)} m na praia`}
          />
        ))}
        <Chip
          label="Vento"
          dot={wk === 'terral' || wk === 'cross-terral' || wk === 'calmo' ? brand.green : brand.plum}
          value={`${dirDeg(h.windDirection)} · ${fmt.kmh(h.windSpeed)} · ${WIND_LABEL[wk]}`}
        />
      </Box>

      <Timeline times={times} index={index} onChange={pick} />
    </Paper>
  )
}
