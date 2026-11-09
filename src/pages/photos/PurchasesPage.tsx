import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Download } from 'iconoir-react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/context'
import { backend, brl, PERIOD_LABEL, type Purchase } from '../../backend'
import { SPOTS } from '../../data/spots'
import { dayLabel } from '../../lib/surf'

const STATUS: Record<Purchase['status'], { label: string; color: 'success' | 'warning' | 'default' }> = {
  paid: { label: 'Pago', color: 'success' },
  pending: { label: 'Aguardando pagamento', color: 'warning' },
  cancelled: { label: 'Cancelado', color: 'default' },
}

export default function PurchasesPage() {
  const { user, ready, requireLogin } = useAuth()
  const [params] = useSearchParams()
  const [list, setList] = useState<Purchase[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const status = params.get('status') ?? params.get('collection_status')

  useEffect(() => {
    document.title = 'Minhas fotos · OlhaOnda'
    if (!user) return
    let alive = true
    backend.photos
      .myPurchases()
      .then((p) => alive && setList(p))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [user])

  const download = async (photoId: string) => {
    try {
      const url = await backend.photos.downloadUrl(photoId)
      const a = document.createElement('a')
      a.href = url
      a.download = `olhaonda-${photoId}.jpg`
      a.target = '_blank'
      a.rel = 'noopener'
      a.click()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível baixar.')
    }
  }

  if (!ready) return null
  if (!user) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>Entre para ver suas fotos compradas.</Typography>
        <Button variant="contained" onClick={() => void requireLogin()}>
          Entrar
        </Button>
      </Paper>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 40 } }}>
        Minhas fotos
      </Typography>
      {status === 'approved' && <Alert severity="success">Pagamento aprovado! Suas fotos estão liberadas para download.</Alert>}
      {status === 'pending' || status === 'in_process' ? (
        <Alert severity="info">Pagamento em processamento. As fotos aparecem aqui assim que o Mercado Pago confirmar.</Alert>
      ) : null}
      {error && <Alert severity="error">{error}</Alert>}

      {!list && <Skeleton variant="rounded" height={200} sx={{ borderRadius: '18px' }} />}
      {list?.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>Você ainda não comprou fotos.</Typography>
          <Button component={RouterLink} to="/fotos" sx={{ mt: 1 }}>
            Procurar minhas fotos
          </Button>
        </Paper>
      )}

      {list?.map((p) => {
        const spot = SPOTS.find((s) => s.id === p.session.spotId)
        const { wd, dm } = dayLabel(p.session.date)
        const st = STATUS[p.status as keyof typeof STATUS] ?? STATUS.cancelled
        return (
          <Paper key={p.id} sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{spot?.name ?? p.session.spotId}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {wd} {dm} · {PERIOD_LABEL[p.session.period]} · {p.session.photographerName} · {brl(p.totalCents)}
                </Typography>
              </Box>
              <Chip label={st.label} color={st.color} size="small" />
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1.5 }}>
              {p.photos.map((ph) => (
                <Box key={ph.id}>
                  <Box component="img" src={ph.previewUrl} alt="" loading="lazy" sx={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                  <Button
                    fullWidth
                    size="small"
                    disabled={p.status !== 'paid'}
                    startIcon={<Download width={16} height={16} />}
                    onClick={() => void download(ph.id)}
                    sx={{ mt: 0.5 }}
                  >
                    Baixar original
                  </Button>
                </Box>
              ))}
            </Box>
          </Paper>
        )
      })}
    </Stack>
  )
}
