import { Alert, Box, Button, Skeleton, Stack } from '@mui/material'
import { Refresh } from 'iconoir-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AdSlot } from '../components/AdSlot'
import { DayStrip } from '../components/DayStrip'
import { HourlyChart } from '../components/HourlyChart'
import { NowPanel } from '../components/NowPanel'
import { SpotCommunity } from '../components/SpotCommunity'
import { HAS_COMMUNITY } from '../config/env'
import { PicoPanel } from '../components/pico/PicoPanel'
import { SpotPicker } from '../components/SpotPicker'
import { TidePanel } from '../components/TidePanel'
import { WeatherPanel } from '../components/WeatherPanel'
import { DEFAULT_SPOT_ID, SPOTS } from '../data/spots'
import { useForecast } from '../hooks/useForecast'
import { useLocalState } from '../hooks/useLocalState'
import { summarizeDays } from '../lib/days'
import { currentHourIndex } from '../lib/surf'

export default function ForecastPage() {
  const [params, setParams] = useSearchParams()
  const [savedId, setSavedId] = useLocalState('olhaonda:spot', DEFAULT_SPOT_ID)
  // ?pico=… na URL tem prioridade (links compartilháveis)
  const spot =
    SPOTS.find((s) => s.id === (params.get('pico') ?? savedId)) ?? SPOTS.find((s) => s.id === DEFAULT_SPOT_ID) ?? SPOTS[0]
  const setSpot = (id: string) => {
    setSavedId(id)
    setParams({ pico: id }, { replace: true })
  }
  const forecast = useForecast(spot)

  const hours = forecast.data?.hours
  const nowIdx = useMemo(() => (hours ? currentHourIndex(hours) : 0), [hours])
  const days = useMemo(() => (hours ? summarizeDays(spot, hours) : []), [spot, hours])
  const weekMax = useMemo(() => Math.max(0, ...(hours ?? []).map((h) => h.waveHeight ?? 0)), [hours])

  // a hora escolhida vale só para o pico em que foi escolhida
  const [pick, setPick] = useState<{ spot: string; time: string } | null>(null)
  const selTime = pick?.spot === spot.id ? pick.time : null
  const setSelTime = useCallback((time: string) => setPick({ spot: spot.id, time }), [spot.id])

  const selected = hours ? (hours.find((h) => h.time === selTime) ?? hours[nowIdx]) : undefined
  const selDate = selected?.time.slice(0, 10) ?? ''
  const dayHours = days.find((d) => d.date === selDate)?.hours ?? []
  const weather = forecast.data?.sun ?? []
  const dayWeather = weather.find((s) => s.date === selDate)

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
    <Stack spacing={2}>
      <SpotPicker value={spot} onChange={(s) => s && setSpot(s.id)} />

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
        <>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: '18px' }} />
          <Skeleton variant="rounded" height={84} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: '18px' }} />
        </>
      )}

      {forecast.status === 'ready' && selected && hours && (
        <>
          <NowPanel spot={spot} hour={selected} isNow={selected.time === hours[nowIdx].time} />
          <DayStrip days={days} selected={selDate} onSelect={pickDay} />
          <PicoPanel spot={spot} hours={hours} selected={selected} onSelect={setSelTime} />
          <HourlyChart spot={spot} hours={dayHours} scaleMax={weekMax} selected={selected.time} onSelect={setSelTime} />
          <AdSlot format="inline" />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
            <TidePanel spot={spot} hours={dayHours} selected={selected.time} sun={dayWeather} onSelect={setSelTime} />
            <WeatherPanel days={weather} selectedDate={selDate} hour={selected} onSelectDay={pickDay} />
          </Box>
        </>
      )}

      {HAS_COMMUNITY && <SpotCommunity spot={spot} />}
    </Stack>
  )
}
