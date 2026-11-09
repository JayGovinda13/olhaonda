import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { Droplet, Flash, SeaWaves, Timer, Wind } from 'iconoir-react'
import type { ReactNode } from 'react'
import type { HourPoint } from '../api/openMeteo'
import { KIND_LABEL, type Spot } from '../data/spots'
import { surfEstimate, surfRange } from '../lib/breaking'
import { dayLabel, dirDeg, energyLabel, energyRatio, fmt, fmtEnergy, WIND_LABEL, waveEnergy, windKind, windStrength } from '../lib/surf'
import { brand } from '../theme'
import { DirArrow } from './bits'
import { SpotMap } from './SpotMap'

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', opacity: 0.72, mb: 0.5 }}>
        {icon}
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Stack>
      {sub && (
        <Typography variant="body2" component="div" sx={{ opacity: 0.72, mt: 0.25 }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

export function NowPanel({ spot, hour, isNow }: { spot: Spot; hour: HourPoint; isNow: boolean }) {
  const wk = windKind(spot, hour.windDirection, hour.windSpeed)
  const surf = surfEstimate(spot, hour)
  const { wd, dm } = dayLabel(hour.time.slice(0, 10))
  const iconProps = { width: 16, height: 16, strokeWidth: 2 }
  const energy = waveEnergy(hour)

  return (
    <Paper
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: brand.deepGreen,
        color: brand.sand,
        border: 'none',
        p: { xs: 3, md: 4 },
      }}
    >
      {/* mapa do pico como marca d'água */}
      <SpotMap spot={spot} />

      <Box sx={{ position: 'relative' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 3 }}
        >
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.7 }}>
              {spot.city} · {spot.state}
              {spot.note ? ` · ${spot.note}` : ''}
            </Typography>
            <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 34, md: 44 } }}>
              {spot.name}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={isNow ? 'Agora' : `${wd} ${dm} · ${fmt.hour(hour.time)}`}
              sx={{ bgcolor: brand.green, color: '#fff' }}
            />
            {spot.sheltered && (
              <Chip
                size="small"
                label="Abrigada"
                variant="outlined"
                sx={{ color: brand.sand, borderColor: 'rgba(245,230,211,.35)' }}
              />
            )}
            <Chip
              size="small"
              label={KIND_LABEL[spot.kind]}
              variant="outlined"
              sx={{ color: brand.sand, borderColor: 'rgba(245,230,211,.35)' }}
            />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 1.1fr) 2fr' },
            gap: { xs: 3, md: 5 },
            alignItems: 'end',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: 56, md: 72 }, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1 }}>
              {surfRange(surf)}
            </Typography>
            {/* só os fatos do vento: sem nota nem juízo sobre as ondas */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 99, bgcolor: 'rgba(245,230,211,.14)', fontWeight: 800 }}>
                {WIND_LABEL[wk]}
              </Box>
              {wk !== 'calmo' && (
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 99, bgcolor: 'rgba(245,230,211,.14)', fontWeight: 800 }}>
                  {windStrength(hour.windSpeed)}
                </Box>
              )}
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.72, mt: 1 }}>
              Na arrebentação (onda comum – séries) · mar aberto {fmt.m(hour.waveHeight)} · mar de vento {fmt.m(hour.windWaveHeight)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
              gap: { xs: 2.5, sm: 3 },
            }}
          >
            <Stat
              icon={<SeaWaves {...iconProps} />}
              label="Swell"
              value={
                <>
                  {fmt.m(hour.swellHeight)} <DirArrow deg={hour.swellDirection} color={brand.green} />
                </>
              }
              sub={`${fmt.s(hour.swellPeakPeriod ?? hour.swellPeriod)} · ${dirDeg(hour.swellDirection)}`}
            />
            <Stat
              icon={<Timer {...iconProps} />}
              label="2º swell"
              value={
                <>
                  {fmt.m(hour.swell2Height)} <DirArrow deg={hour.swell2Direction} color={brand.green} />
                </>
              }
              sub={`${fmt.s(hour.swell2Period)} · ${dirDeg(hour.swell2Direction)}`}
            />
            <Stat
              icon={<Wind {...iconProps} />}
              label="Vento"
              value={
                <>
                  {fmt.kmh(hour.windSpeed)} <DirArrow deg={hour.windDirection} color={brand.sand} />
                </>
              }
              sub={`${WIND_LABEL[wk]} · ${dirDeg(hour.windDirection)} · raj. ${fmt.kmh(hour.windGusts)}`}
            />
            <Stat
              icon={<Flash {...iconProps} />}
              label="Força"
              value={fmtEnergy(energy)}
              sub={
                <Box component="span" sx={{ display: 'block' }}>
                  {energyLabel(energy)} · por metro de onda
                  <Box component="span" sx={{ display: 'block', mt: 0.75, height: 4, borderRadius: 2, bgcolor: 'rgba(245,230,211,.2)', overflow: 'hidden' }}>
                    <Box component="span" sx={{ display: 'block', height: '100%', width: `${energyRatio(energy) * 100}%`, bgcolor: brand.green }} />
                  </Box>
                </Box>
              }
            />
            <Stat
              icon={<Droplet {...iconProps} />}
              label="Água"
              value={fmt.c(hour.waterTemp)}
              sub={`Ar ${fmt.c(hour.airTemp)}`}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}
