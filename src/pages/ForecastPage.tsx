import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { Refresh } from 'iconoir-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { AdSlot } from '../components/AdSlot'
import { DayStrip } from '../components/DayStrip'
import { HourlyChart } from '../components/HourlyChart'
import { NowPanel } from '../components/NowPanel'
import { SpotCommunity } from '../components/SpotCommunity'
import { HAS_COMMUNITY } from '../config/env'
import { FavoriteButton } from '../components/community/FavoriteButton'
import { PicoPanel } from '../components/pico/PicoPanel'
import { SpotPicker } from '../components/SpotPicker'
import { TidePanel } from '../components/TidePanel'
import { WeatherPanel } from '../components/WeatherPanel'
import { WindPanel } from '../components/WindPanel'
import { DEFAULT_SPOT_ID, SPOT_ALIASES, SPOTS } from '../data/spots'
import { useForecast } from '../hooks/useForecast'
import { useLocalState } from '../hooks/useLocalState'
import { summarizeDays } from '../lib/days'
import { surfEstimate } from '../lib/breaking'
import { usePageMeta } from '../lib/meta'
import { currentHourIndex, dayLabel, fmt } from '../lib/surf'

export default function ForecastPage() {
  // o pico vem do endereço (/pico/:id), que é compartilhável
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [, setSavedId] = useLocalState('olhaonda:spot', DEFAULT_SPOT_ID)
  const found = SPOTS.find((s) => s.id === id)
  const spot = found ?? SPOTS.find((s) => s.id === DEFAULT_SPOT_ID) ?? SPOTS[0]
  useEffect(() => {
    if (found) setSavedId(found.id) // lembra o último pico para a tela de início
  }, [found, setSavedId])
  const setSpot = (next: string) => navigate(`/pico/${next}`)
  const forecast = useForecast(spot)

  const hours = forecast.data?.hours
  const nowIdx = useMemo(() => (hours ? currentHourIndex(hours) : 0), [hours])
  const days = useMemo(() => (hours ? summarizeDays(spot, hours) : []), [spot, hours])
  const weekMax = useMemo(() => Math.max(0, ...(hours ?? []).map((h) => surfEstimate(spot, h)?.hb ?? 0)), [spot, hours])

  // a hora escolhida vale só para o pico em que foi escolhida
  // ?t=2026-11-12T06:00 (links dos avisos e do fórum) abre direto naquela hora
  const [params] = useSearchParams()
  const linked = params.get('t')
  const [pick, setPick] = useState<{ spot: string; time: string } | null>(null)
  const selTime = pick?.spot === spot.id ? pick.time : linked
  const setSelTime = useCallback((time: string) => setPick({ spot: spot.id, time }), [spot.id])

  const selected = hours ? (hours.find((h) => h.time === selTime) ?? hours[nowIdx]) : undefined
  const selDate = selected?.time.slice(0, 10) ?? ''
  const dayHours = days.find((d) => d.date === selDate)?.hours ?? []
  const weather = forecast.data?.sun ?? []

  usePageMeta({
    title: `${spot.name} (${spot.city}) · Previsão de ondas · OlhaOnda`,
    description: `Previsão de ondas para ${spot.name}, ${spot.city}: altura, swell, período, força da onda, vento terral ou maral, maré no padrão da Marinha e tempo, hora a hora e para 14 dias.`,
    path: `/pico/${spot.id}`,
  })

  const pickDay = (date: string) => {
    if (!hours) return
    // mantém a mesma hora do dia; no dia de hoje volta para "agora"
    const hh = selected ? selected.time.slice(11) : '07:00'
    const now = hours[nowIdx]
    const target = now.time.startsWith(date) ? now.time : `${date}T${hh}`
    setSelTime(hours.some((h) => h.time === target) ? target : `${date}T07:00`)
  }

  // pico inexistente (ou que não está neste ambiente): volta para a escolha da praia
  if (!found) return <Navigate to={SPOT_ALIASES[id] ? `/pico/${SPOT_ALIASES[id]}` : '/'} replace />

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box sx={{ flex: '0 1 420px', minWidth: 0 }}>
          <SpotPicker value={spot} onChange={(s) => s && setSpot(s.id)} />
        </Box>
        {HAS_COMMUNITY && <FavoriteButton spot={spot} compact />}
      </Stack>

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
          <HourlyChart spot={spot} hours={dayHours} scaleMax={weekMax} selected={selected.time} onSelect={setSelTime} />
          <PicoPanel spot={spot} hours={hours} selected={selected} onSelect={setSelTime} />
          <AdSlot format="inline" />
          {/* tempo, vento e maré andam juntos: mesmo dia e mesma hora, escolhidos em qualquer um dos três */}
          <Box component="section" aria-labelledby="condicoes">
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap', mb: 1.25, px: 0.5 }}>
              <Typography id="condicoes" variant="h6" component="h2">
                Tempo, vento e maré
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 700 }}>
                {dayLabel(selDate).wd} {dayLabel(selDate).dm} · {fmt.hour(selected.time)}
              </Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              <WeatherPanel
                days={weather}
                selectedDate={selDate}
                hour={selected}
                dayHours={dayHours}
                onSelectDay={pickDay}
                onSelectHour={setSelTime}
              />
              <WindPanel spot={spot} hour={selected} dayHours={dayHours} allHours={hours} onSelectHour={setSelTime} onSelectDay={pickDay} />
              <TidePanel spot={spot} hours={dayHours} allHours={hours} selected={selected.time} onSelect={setSelTime} onSelectDay={pickDay} />
            </Box>
          </Box>
        </>
      )}

      {HAS_COMMUNITY && <SpotCommunity spot={spot} />}
    </Stack>
  )
}
