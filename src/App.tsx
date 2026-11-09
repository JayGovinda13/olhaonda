import { Alert, Box, Button, Container, Link, Skeleton, Stack, Typography } from '@mui/material'
import { Refresh } from 'iconoir-react'
import { useEffect, useMemo, useState } from 'react'
import { DayStrip } from './components/DayStrip'
import { Header } from './components/Header'
import { HourlyChart } from './components/HourlyChart'
import { LogoMark } from './components/Logo'
import { NowPanel } from './components/NowPanel'
import { SpotCompass } from './components/SpotCompass'
import { TidePanel } from './components/TidePanel'
import { DEFAULT_SPOT_ID, SPOTS } from './data/spots'
import { useForecast } from './hooks/useForecast'
import { useLocalState } from './hooks/useLocalState'
import { summarizeDays } from './lib/days'
import { currentHourIndex } from './lib/surf'

export default function App() {
  const [spotId, setSpotId] = useLocalState('olhaonda:spot', DEFAULT_SPOT_ID)
  const spot = SPOTS.find((s) => s.id === spotId) ?? SPOTS[0]
  const forecast = useForecast(spot)

  const hours = forecast.data?.hours
  const nowIdx = useMemo(() => (hours ? currentHourIndex(hours) : 0), [hours])
  const days = useMemo(() => (hours ? summarizeDays(spot, hours) : []), [spot, hours])
  const weekMax = useMemo(() => Math.max(0, ...(hours ?? []).map((h) => h.waveHeight ?? 0)), [hours])

  // a hora escolhida vale só para o pico em que foi escolhida
  const [pick, setPick] = useState<{ spot: string; time: string } | null>(null)
  const selTime = pick?.spot === spot.id ? pick.time : null
  const setSelTime = (time: string) => setPick({ spot: spot.id, time })

  const selected = hours ? (hours.find((h) => h.time === selTime) ?? hours[nowIdx]) : undefined
  const selDate = selected?.time.slice(0, 10) ?? ''
  const dayHours = days.find((d) => d.date === selDate)?.hours ?? []
  const sun = forecast.data?.sun.find((s) => s.date === selDate)

  useEffect(() => {
    document.title = `${spot.name} · OlhaOnda`
  }, [spot.name])

  const pickDay = (date: string) => {
    if (!hours) return
    // mantém a mesma hora do dia; no dia de hoje volta para "agora"
    const hh = selected ? selected.time.slice(11) : '07:00'
    const now = hours[nowIdx]
    const target = now.time.startsWith(date) ? now.time : `${date}T${hh}`
    setSelTime(hours.some((h) => h.time === target) ? target : `${date}T07:00`)
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header spot={spot} onChange={(s) => setSpotId(s.id)} />

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {forecast.status === 'error' && (
          <Alert
            severity="error"
            variant="outlined"
            action={
              <Button color="inherit" startIcon={<Refresh width={16} height={16} />} onClick={forecast.retry}>
                Tentar de novo
              </Button>
            }
          >
            {forecast.error}
          </Alert>
        )}

        {forecast.status === 'loading' && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4.5 }} />
            <Skeleton variant="rounded" height={84} sx={{ borderRadius: '16px' }} />
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4.5 }} />
          </Stack>
        )}

        {forecast.status === 'ready' && selected && hours && (
          <Stack spacing={2}>
            <NowPanel spot={spot} hour={selected} isNow={selected.time === hours[nowIdx].time} />
            <DayStrip days={days} selected={selDate} onSelect={pickDay} />
            <HourlyChart
              spot={spot}
              hours={dayHours}
              scaleMax={weekMax}
              selected={selected.time}
              onSelect={setSelTime}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TidePanel hours={dayHours} selected={selected.time} sun={sun} />
              <SpotCompass spot={spot} hour={selected} />
            </Box>
          </Stack>
        )}
      </Container>

      <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', mt: 4 }}>
        <Container
          maxWidth="lg"
          sx={{
            py: 3,
            px: { xs: 2, sm: 3 },
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <LogoMark size={22} />
          <Typography variant="body2" sx={{ opacity: 0.7, flex: 1, minWidth: 240 }}>
            Previsão de ondas para o litoral brasileiro. Dados:{' '}
            <Link href="https://open-meteo.com/" target="_blank" rel="noopener" color="inherit">
              Open-Meteo
            </Link>{' '}
            (ECMWF WAM, Météo-France MFWAM, NOAA GFS-Wave), CC BY 4.0.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
