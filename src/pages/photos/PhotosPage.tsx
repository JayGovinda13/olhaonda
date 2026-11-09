import { Alert, Box, Button, ButtonBase, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { Camera, MediaImage } from 'iconoir-react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { backend, brl, PERIOD_LABEL, type PhotoSession } from '../../backend'
import { SpotPicker } from '../../components/SpotPicker'
import { SPOTS } from '../../data/spots'
import { dayLabel } from '../../lib/surf'
import { brand } from '../../theme'

export function SessionCard({ s }: { s: PhotoSession }) {
  const spot = SPOTS.find((x) => x.id === s.spotId)
  const { wd, dm } = dayLabel(s.date)
  return (
    <ButtonBase
      component={RouterLink}
      to={`/fotos/sessao/${s.id}`}
      sx={{
        display: 'block',
        textAlign: 'left',
        borderRadius: '18px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid rgba(75,29,90,.08)',
        transition: 'transform .2s',
        '&:hover': { transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ aspectRatio: '3 / 2', bgcolor: 'rgba(15,76,58,.12)', position: 'relative' }}>
        {s.coverUrl ? (
          <Box component="img" src={s.coverUrl} alt="" loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: brand.deepGreen }}>
            <MediaImage width={32} height={32} />
          </Box>
        )}
        <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: brand.purple, color: brand.sand, px: 1.25, py: 0.25, borderRadius: 99, fontSize: 12, fontWeight: 800 }}>
          {s.photoCount} fotos
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17 }}>{spot?.name ?? s.spotId}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          {wd} {dm} · {PERIOD_LABEL[s.period]} · {s.photographerName}
        </Typography>
        <Typography sx={{ fontWeight: 800, color: brand.deepGreen, mt: 0.75 }}>{brl(s.priceCents)} por foto</Typography>
      </Box>
    </ButtonBase>
  )
}

export default function PhotosPage() {
  const [params, setParams] = useSearchParams()
  const spotId = params.get('pico')
  const date = params.get('data')
  const key = `${spotId}|${date}`
  const [result, setResult] = useState<{ key: string; sessions: PhotoSession[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Fotos de surf · OlhaOnda'
    let alive = true
    backend.photos
      .listSessions({ spotId, date })
      .then((sessions) => alive && setResult({ key, sessions }))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [spotId, date, key])

  const update = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const sessions = result?.key === key ? result.sessions : null

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: { xs: 3, md: 4 }, bgcolor: brand.deepGreen, color: brand.sand, border: 'none' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 40 } }}>
              Ache suas fotos na água
            </Typography>
            <Typography sx={{ opacity: 0.8, mt: 0.5, maxWidth: 560 }}>
              Escolha o pico e o dia que você surfou. Pague com Pix ou cartão e baixe em alta resolução, sem marca d'água.
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/fotos/vender"
            variant="contained"
            color="success"
            size="large"
            startIcon={<Camera width={18} height={18} />}
            sx={{ borderRadius: 99, flexShrink: 0 }}
          >
            Sou fotógrafo
          </Button>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <SpotPicker value={SPOTS.find((s) => s.id === spotId) ?? null} onChange={(s) => update('pico', s?.id ?? null)} allowEmpty placeholder="Qual pico?" />
        <TextField
          type="date"
          size="small"
          label="Dia"
          value={date ?? ''}
          onChange={(e) => update('data', e.target.value || null)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 99, bgcolor: 'background.paper' } }}
        />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2 }}>
        {!sessions && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: '18px' }} />)}
        {sessions?.map((s) => <SessionCard key={s.id} s={s} />)}
      </Box>
      {sessions?.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>Nenhuma sessão encontrada com esses filtros.</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Tente outro dia ou limpe o filtro de pico.
          </Typography>
        </Paper>
      )}
    </Stack>
  )
}
