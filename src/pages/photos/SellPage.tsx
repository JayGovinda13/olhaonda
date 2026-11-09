import {
  Alert,
  Box,
  Button,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Camera, Check, Plus, Upload, Wallet } from 'iconoir-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/context'
import { backend, brl, PERIOD_LABEL, type Period, type PhotoSession } from '../../backend'
import { makePreview } from '../../backend/watermark'
import { SpotPicker } from '../../components/SpotPicker'
import { SPOTS } from '../../data/spots'
import { dayLabel } from '../../lib/surf'
import { brand } from '../../theme'

const FEE = Number(import.meta.env.VITE_PLATFORM_FEE_PERCENT ?? 20)
const todayIso = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10)

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 99,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            bgcolor: done ? brand.green : brand.purple,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {done ? <Check width={16} height={16} strokeWidth={3} /> : n}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Stack>
      {children}
    </Paper>
  )
}

export default function SellPage() {
  const { user, ready, requireLogin, refresh } = useAuth()
  const [params] = useSearchParams()
  const [sessions, setSessions] = useState<PhotoSession[] | null>(null)
  const [instagram, setInstagram] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Venda suas fotos · OlhaOnda'
  }, [])

  useEffect(() => {
    if (!user?.isPhotographer) return
    let alive = true
    backend.photos.mySessions().then((s) => alive && setSessions(s))
    return () => {
      alive = false
    }
  }, [user])

  // voltou do Mercado Pago: recarrega o perfil para refletir a conexão
  useEffect(() => {
    if (params.get('mp') === 'connected') void refresh()
  }, [params, refresh])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado.')
    } finally {
      setBusy(false)
    }
  }

  const intro = (
    <Paper sx={{ p: { xs: 3, md: 4 }, bgcolor: brand.purple, color: brand.sand, border: 'none' }}>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
        Venda suas fotos de surf
      </Typography>
      <Typography sx={{ opacity: 0.85, mt: 1, maxWidth: 640 }}>
        Publique a sessão por pico e dia, defina o preço e receba direto na sua conta Mercado Pago a cada venda. O OlhaOnda
        fica com {FEE}% para manter a plataforma. Os originais ficam protegidos: o público só vê prévias com marca d'água.
      </Typography>
    </Paper>
  )

  if (!ready) return null

  if (!user) {
    return (
      <Stack spacing={2}>
        {intro}
        <Box>
          <Button variant="contained" size="large" onClick={() => void requireLogin('Entre para vender suas fotos.')}>
            Entrar para começar
          </Button>
        </Box>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      {intro}
      {error && <Alert severity="error">{error}</Alert>}

      <Step n={1} title="Perfil de fotógrafo" done={user.isPhotographer}>
        {user.isPhotographer ? (
          <Typography sx={{ opacity: 0.75 }}>Ativo como {user.instagram || user.name}.</Typography>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              label="Instagram (aparece como crédito)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">@</InputAdornment> } }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              disabled={busy}
              onClick={() => void run(() => backend.auth.becomePhotographer(instagram ? `@${instagram}` : null).then(refresh))}
              startIcon={<Camera width={18} height={18} />}
            >
              Ativar perfil
            </Button>
          </Stack>
        )}
      </Step>

      {user.isPhotographer && (
        <Step n={2} title="Receber pagamentos" done={user.paymentsConnected}>
          {user.paymentsConnected ? (
            <Typography sx={{ opacity: 0.75 }}>Conta Mercado Pago conectada. As vendas caem direto para você (Pix na hora).</Typography>
          ) : (
            <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Typography sx={{ opacity: 0.75 }}>
                Conecte sua conta Mercado Pago. O comprador paga com Pix ou cartão e o valor é dividido automaticamente: você recebe{' '}
                {100 - FEE}% e a plataforma {FEE}%.
              </Typography>
              <Button
                variant="contained"
                color="success"
                disabled={busy}
                startIcon={<Wallet width={18} height={18} />}
                onClick={() =>
                  void run(async () => {
                    const url = await backend.photos.connectPaymentsUrl()
                    window.location.assign(url)
                  })
                }
              >
                Conectar Mercado Pago
              </Button>
            </Stack>
          )}
        </Step>
      )}

      {user.isPhotographer && (
        <Step n={3} title="Publicar sessão">
          <NewSessionForm onCreated={(s) => setSessions((prev) => [s, ...(prev ?? [])])} />
        </Step>
      )}

      {user.isPhotographer && sessions && sessions.length > 0 && (
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ pt: 1 }}>
            Minhas sessões
          </Typography>
          {sessions.map((s) => (
            <SessionUploader
              key={s.id}
              session={s}
              credit={user.instagram || user.name}
              onChange={(n) => setSessions((prev) => prev?.map((x) => (x.id === n.id ? n : x)) ?? null)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function NewSessionForm({ onCreated }: { onCreated: (s: PhotoSession) => void }) {
  const [spotId, setSpotId] = useState<string | null>('gua-tombo-palanque')
  const [date, setDate] = useState(todayIso())
  const [period, setPeriod] = useState<Period>('manha')
  const [price, setPrice] = useState('25')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!spotId) return
    const cents = Math.round(Number(price.replace(',', '.')) * 100)
    if (!(cents >= 300 && cents <= 100000)) {
      setError('Preço por foto entre R$ 3 e R$ 1.000.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      onCreated(await backend.photos.createSession({ spotId, date, period, title: null, priceCents: cents }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a sessão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box component="form" onSubmit={submit}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'center' }}>
        <SpotPicker value={SPOTS.find((s) => s.id === spotId) ?? null} onChange={(s) => setSpotId(s?.id ?? null)} locate={false} width="100%" />
        <TextField type="date" size="small" label="Dia" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} required />
        <TextField select size="small" label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <MenuItem value="manha">Manhã</MenuItem>
          <MenuItem value="tarde">Tarde</MenuItem>
        </TextField>
        <TextField
          size="small"
          label="Preço por foto"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> }, htmlInput: { inputMode: 'decimal' } }}
        />
        <Button type="submit" variant="contained" disabled={busy || !spotId} startIcon={<Plus width={18} height={18} />}>
          Criar
        </Button>
      </Box>
    </Box>
  )
}

function SessionUploader({ session, credit, onChange }: { session: PhotoSession; credit: string; onChange: (s: PhotoSession) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const spot = SPOTS.find((s) => s.id === session.spotId)
  const { wd, dm } = dayLabel(session.date)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    setError(null)
    setProgress({ done: 0, total: list.length })
    let count = session.photoCount
    let cover = session.coverUrl
    for (const [i, f] of list.entries()) {
      try {
        const { blob, width, height } = await makePreview(f, credit)
        const photo = await backend.photos.uploadPhoto(session.id, f, blob, { width, height })
        count++
        cover = cover ?? photo.previewUrl
      } catch (e) {
        setError(`${f.name}: ${e instanceof Error ? e.message : 'falha no envio'}`)
      }
      setProgress({ done: i + 1, total: list.length })
    }
    onChange({ ...session, photoCount: count, coverUrl: cover })
    setProgress(null)
    if (input.current) input.current.value = ''
  }

  return (
    <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <Box
        sx={{
          width: 96,
          aspectRatio: '3 / 2',
          borderRadius: '10px',
          overflow: 'hidden',
          bgcolor: 'rgba(15,76,58,.12)',
          flexShrink: 0,
        }}
      >
        {session.coverUrl && <Box component="img" src={session.coverUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 180 }}>
        <Typography sx={{ fontWeight: 800 }}>{spot?.name ?? session.spotId}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          {wd} {dm} · {PERIOD_LABEL[session.period]} · {brl(session.priceCents)} · {session.photoCount} fotos
        </Typography>
        {progress && <LinearProgress variant="determinate" value={(progress.done / progress.total) * 100} sx={{ mt: 1, borderRadius: 2 }} color="success" />}
        {error && <Typography sx={{ color: 'error.main', fontSize: 13, mt: 0.5 }}>{error}</Typography>}
      </Box>
      <Stack direction="row" spacing={1}>
        {session.photoCount > 0 && (
          <Button component={RouterLink} to={`/fotos/sessao/${session.id}`} size="small">
            Ver
          </Button>
        )}
        <Button variant="outlined" size="small" startIcon={<Upload width={16} height={16} />} disabled={!!progress} onClick={() => input.current?.click()}>
          {progress ? `${progress.done}/${progress.total}` : 'Enviar fotos'}
        </Button>
      </Stack>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => void upload(e.target.files)} />
    </Paper>
  )
}
