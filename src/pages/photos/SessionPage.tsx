import { Alert, Box, Button, ButtonBase, Checkbox, Dialog, IconButton, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { ArrowLeft, Cart, NavArrowLeft, NavArrowRight, Xmark } from 'iconoir-react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/context'
import { backend, brl, PERIOD_LABEL, type Photo, type PhotoSession } from '../../backend'
import { SPOTS } from '../../data/spots'
import { dayLabel } from '../../lib/surf'
import { alpha, brand } from '../../theme'

export default function SessionPage() {
  const { id = '' } = useParams()
  const [data, setData] = useState<{ id: string; session: PhotoSession; photos: Photo[] } | 'missing' | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewer, setViewer] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, requireLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    backend.photos.getSession(id).then((r) => alive && setData(r ? { id, ...r } : 'missing'))
    return () => {
      alive = false
    }
  }, [id])

  if (data === 'missing') {
    return (
      <Alert severity="warning" action={<Button component={RouterLink} to="/fotos">Voltar</Button>}>
        Sessão não encontrada.
      </Alert>
    )
  }
  const current = data?.id === id ? data : null
  const s = current?.session
  const photos = current?.photos ?? []
  const spot = s ? SPOTS.find((x) => x.id === s.spotId) : null
  const own = !!user && s?.photographerId === user.id
  const total = s ? s.priceCents * selected.size : 0

  const toggle = (pid: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })

  const buy = async () => {
    if (!s || !selected.size) return
    if (!(await requireLogin('Entre para comprar suas fotos.'))) return
    setBusy(true)
    setError(null)
    try {
      const { redirectUrl } = await backend.photos.checkout(s.id, [...selected])
      if (redirectUrl.startsWith('/')) navigate(redirectUrl)
      else window.location.assign(redirectUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar o pagamento.')
      setBusy(false)
    }
  }

  const vp = viewer != null ? photos[viewer] : null

  return (
    <Stack spacing={2} sx={{ pb: selected.size ? 10 : 0 }}>
      <Box>
        <Button component={RouterLink} to={s ? `/fotos?pico=${s.spotId}` : '/fotos'} startIcon={<ArrowLeft width={16} height={16} />} size="small">
          Fotos
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
        {!s ? (
          <Skeleton width="50%" height={44} />
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" component="h1">
                {spot?.name ?? s.spotId}
              </Typography>
              <Typography sx={{ opacity: 0.7 }}>
                {dayLabel(s.date).wd} {dayLabel(s.date).dm} · {PERIOD_LABEL[s.period]} · por {s.photographerName}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { sm: 'right' } }}>
              <Typography sx={{ fontWeight: 800, fontSize: 22, color: brand.deepGreen }}>{brl(s.priceCents)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                por foto em alta resolução
              </Typography>
            </Box>
          </Stack>
        )}
        {own && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Esta é a sua sessão. Envie mais fotos pelo <RouterLink to="/fotos/vender">painel do fotógrafo</RouterLink>.
          </Alert>
        )}
      </Paper>

      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        Toque numa foto para ampliar e marque as que são suas.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(200px, 1fr))' }, gap: 1.5 }}>
        {!current && Array.from({ length: 8 }, (_, i) => <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '3 / 2', height: 'auto', borderRadius: '14px' }} />)}
        {photos.map((p, i) => {
          const on = selected.has(p.id)
          return (
            <Box
              key={p.id}
              sx={{
                position: 'relative',
                borderRadius: '14px',
                overflow: 'hidden',
                outline: on ? `3px solid ${brand.green}` : 'none',
                outlineOffset: -3,
              }}
            >
              <ButtonBase onClick={() => setViewer(i)} sx={{ display: 'block', width: '100%' }} aria-label={`Ampliar foto ${i + 1}`}>
                <Box component="img" src={p.previewUrl} alt={`Foto ${i + 1}`} loading="lazy" sx={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', display: 'block' }} />
              </ButtonBase>
              {!own && (
                <Checkbox
                  checked={on}
                  onChange={() => toggle(p.id)}
                  slotProps={{ input: { 'aria-label': `Selecionar foto ${i + 1}` } }}
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    bgcolor: alpha(brand.sand, 0.9),
                    borderRadius: '10px',
                    p: 0.5,
                    '&:hover': { bgcolor: brand.sand },
                    '&.Mui-checked': { color: brand.deepGreen },
                  }}
                />
              )}
            </Box>
          )
        })}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {selected.size > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            left: '50%',
            bottom: 16,
            transform: 'translateX(-50%)',
            width: 'min(640px, calc(100% - 32px))',
            p: 1.5,
            pl: 2.5,
            bgcolor: brand.purple,
            color: brand.sand,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 20,
            boxShadow: '0 12px 40px rgba(75,29,90,.35)',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800 }}>
              {selected.size} foto{selected.size > 1 ? 's' : ''} · {brl(total)}
            </Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.75 }}>Pix ou cartão via Mercado Pago</Typography>
          </Box>
          <Button variant="contained" color="success" onClick={() => void buy()} disabled={busy} startIcon={<Cart width={18} height={18} />} sx={{ borderRadius: 99 }}>
            Comprar
          </Button>
        </Paper>
      )}

      <Dialog open={!!vp} onClose={() => setViewer(null)} maxWidth="lg" fullWidth slotProps={{ paper: { sx: { bgcolor: '#111', borderRadius: '18px', border: 'none' } } }}>
        {vp && viewer != null && (
          <Box sx={{ position: 'relative' }}>
            <Box component="img" src={vp.previewUrl} alt="" sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
            <IconButton onClick={() => setViewer(null)} aria-label="Fechar" sx={{ position: 'absolute', top: 8, right: 8, bgcolor: alpha(brand.sand, 0.9) }}>
              <Xmark width={20} height={20} />
            </IconButton>
            {viewer > 0 && (
              <IconButton onClick={() => setViewer(viewer - 1)} aria-label="Anterior" sx={{ position: 'absolute', top: '50%', left: 8, bgcolor: alpha(brand.sand, 0.9) }}>
                <NavArrowLeft width={20} height={20} />
              </IconButton>
            )}
            {viewer < photos.length - 1 && (
              <IconButton onClick={() => setViewer(viewer + 1)} aria-label="Próxima" sx={{ position: 'absolute', top: '50%', right: 8, bgcolor: alpha(brand.sand, 0.9) }}>
                <NavArrowRight width={20} height={20} />
              </IconButton>
            )}
            {!own && (
              <Box sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)' }}>
                <Button variant="contained" color={selected.has(vp.id) ? 'secondary' : 'success'} onClick={() => toggle(vp.id)} sx={{ borderRadius: 99 }}>
                  {selected.has(vp.id) ? 'Remover da seleção' : 'É minha, selecionar'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Dialog>
    </Stack>
  )
}
