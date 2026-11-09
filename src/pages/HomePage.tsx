import { Box, Button, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ArrowRight, Position } from 'iconoir-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Wordmark } from '../components/Logo'
import { SpotPicker } from '../components/SpotPicker'
import { DEFAULT_SPOT_ID, KIND_LABEL, nearestSpot, SPOTS, type Spot } from '../data/spots'
import { useLocalState } from '../hooks/useLocalState'
import { dirDeg } from '../lib/surf'
import { brand } from '../theme'

/** Tela de início: o usuário escolhe a praia da previsão. */
export default function HomePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [savedId] = useLocalState('olhaonda:spot', DEFAULT_SPOT_ID)
  const [locating, setLocating] = useState(false)
  const last = SPOTS.find((s) => s.id === savedId)

  useEffect(() => {
    document.title = 'OlhaOnda · Previsão de ondas'
  }, [])

  // grupos na ordem em que aparecem na lista (de sudoeste para nordeste)
  const groups = useMemo(() => {
    const out: { name: string; spots: Spot[] }[] = []
    for (const s of SPOTS) {
      const g = s.region ?? s.state
      const cur = out.find((x) => x.name === g)
      if (cur) cur.spots.push(s)
      else out.push({ name: g, spots: [s] })
    }
    return out
  }, [])

  // links antigos (/?pico=…) continuam funcionando
  const legacy = params.get('pico')
  if (legacy && SPOTS.some((s) => s.id === legacy)) return <Navigate to={`/pico/${legacy}`} replace />

  const go = (s: Spot | null) => s && navigate(`/pico/${s.id}`)

  const nearMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        go(nearestSpot(pos.coords.latitude, pos.coords.longitude))
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }

  return (
    <Stack spacing={4}>
      {/* destaque */}
      <Box sx={{ textAlign: 'center', pt: { xs: 2, md: 6 }, pb: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'inline-block', mb: 3 }}>
          <Wordmark height={56} />
        </Box>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 44 }, maxWidth: 720, mx: 'auto' }}>
          Onde você vai cair hoje?
        </Typography>
        <Typography sx={{ opacity: 0.75, mt: 1, maxWidth: 560, mx: 'auto' }}>
          Escolha a praia para ver ondas, vento, maré e tempo de hora em hora.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center', alignItems: 'center', mt: 3 }}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <SpotPicker value={null} onChange={go} allowEmpty locate={false} placeholder="Buscar praia ou pico" width="100%" />
          </Box>
          <Button
            variant="outlined"
            onClick={nearMe}
            disabled={locating}
            startIcon={<Position width={18} height={18} />}
            sx={{ borderRadius: 99, whiteSpace: 'nowrap', bgcolor: 'background.paper' }}
          >
            Perto de mim
          </Button>
        </Stack>
        {last && (
          <Button
            onClick={() => go(last)}
            endIcon={<ArrowRight width={16} height={16} />}
            sx={{ mt: 2, borderRadius: 99, fontWeight: 800 }}
          >
            Continuar em {last.name} · {last.city}
          </Button>
        )}
      </Box>

      {/* praias por cidade */}
      {groups.map((g) => (
        <Box key={g.name} component="section">
          <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
            {g.name}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 210px), 1fr))', gap: 1.5 }}>
            {g.spots.map((s) => (
              <Paper key={s.id} sx={{ p: 0, overflow: 'hidden' }}>
                <ButtonBase
                  onClick={() => go(s)}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                    px: 2,
                    py: 1.5,
                    gap: 1,
                    '&:hover': { bgcolor: alpha(brand.green, 0.08) },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>
                      {s.name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {KIND_LABEL[s.kind]} · {dirDeg(s.facing)}
                    </Typography>
                  </Box>
                  <ArrowRight width={18} height={18} color={brand.plum} />
                </ButtonBase>
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  )
}
