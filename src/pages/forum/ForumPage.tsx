import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ChatBubble, Plus } from 'iconoir-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/context'
import { backend, FORUM_CATEGORIES, type ForumCategory, type Thread } from '../../backend'
import { SpotPicker } from '../../components/SpotPicker'
import { SPOTS } from '../../data/spots'
import { timeAgo } from '../../lib/time'
import { brand } from '../../theme'

const catLabel = (id: ForumCategory) => FORUM_CATEGORIES.find((c) => c.id === id)?.label ?? id
const spotName = (id: string | null) => (id ? SPOTS.find((s) => s.id === id)?.name : null)

export default function ForumPage() {
  const [params, setParams] = useSearchParams()
  const category = (params.get('cat') as ForumCategory | null) ?? null
  const spotId = params.get('pico')
  const spot = SPOTS.find((s) => s.id === spotId) ?? null
  const [result, setResult] = useState<{ key: string; threads: Thread[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { requireLogin } = useAuth()
  const navigate = useNavigate()
  const key = `${category}|${spotId}`
  const composing = params.get('novo') === '1'

  useEffect(() => {
    document.title = 'Fórum · OlhaOnda'
    let alive = true
    backend.forum
      .listThreads({ category, spotId })
      .then((threads) => alive && setResult({ key, threads }))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [category, spotId, key])

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }

  const openComposer = async () => {
    if (await requireLogin('Entre para criar um tópico no fórum.')) update({ novo: '1' })
  }

  const threads = result?.key === key ? result.threads : null

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 40 } }}>
            Fórum
          </Typography>
          <Typography sx={{ opacity: 0.7 }}>Condições, picos, equipamento e trips. Respeite o local e o próximo.</Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<Plus width={18} height={18} />} onClick={() => void openComposer()} sx={{ borderRadius: 99 }}>
          Novo tópico
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, flex: 1 }}>
          <Chip label="Tudo" onClick={() => update({ cat: null })} color={!category ? 'primary' : 'default'} variant={!category ? 'filled' : 'outlined'} />
          {FORUM_CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              onClick={() => update({ cat: c.id })}
              color={category === c.id ? 'primary' : 'default'}
              variant={category === c.id ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
        <SpotPicker value={spot} onChange={(s) => update({ pico: s?.id ?? null })} allowEmpty locate={false} placeholder="Filtrar por pico" width={320} />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ overflow: 'hidden' }}>
        {!threads &&
          Array.from({ length: 4 }, (_, i) => (
            <Box key={i} sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
              <Skeleton width="60%" height={28} />
              <Skeleton width="30%" />
            </Box>
          ))}
        {threads?.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700 }}>Nenhum tópico por aqui ainda.</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Seja o primeiro a contar como está o mar.
            </Typography>
          </Box>
        )}
        {threads?.map((t, i) => (
          <ButtonBase
            key={t.id}
            component={RouterLink}
            to={`/forum/${t.id}`}
            sx={{
              display: 'flex',
              width: '100%',
              textAlign: 'left',
              gap: 2,
              p: { xs: 2, sm: 2.5 },
              borderTop: i ? 1 : 0,
              borderColor: 'divider',
              alignItems: 'center',
              '&:hover': { bgcolor: alpha(brand.purple, 0.04) },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                <Chip size="small" label={catLabel(t.category)} sx={{ height: 22, fontSize: 11, bgcolor: alpha(brand.green, 0.14), color: brand.deepGreen }} />
                {t.spotId && <Chip size="small" label={spotName(t.spotId)} variant="outlined" sx={{ height: 22, fontSize: 11 }} />}
              </Stack>
              <Typography sx={{ fontWeight: 800, fontSize: 17 }}>{t.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.65 }}>
                {t.authorName} · {timeAgo(t.lastActivityAt)}
              </Typography>
            </Box>
            <Stack sx={{ alignItems: 'center', minWidth: 48, color: brand.plum }}>
              <ChatBubble width={18} height={18} />
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{t.replyCount}</Typography>
            </Stack>
          </ButtonBase>
        ))}
      </Paper>

      <NewThreadDialog
        open={composing}
        defaultSpot={spotId}
        defaultCategory={category}
        onClose={() => update({ novo: null })}
        onCreated={(t) => navigate(`/forum/${t.id}`)}
      />
    </Stack>
  )
}

function NewThreadDialog({
  open,
  defaultSpot,
  defaultCategory,
  onClose,
  onCreated,
}: {
  open: boolean
  defaultSpot: string | null
  defaultCategory: ForumCategory | null
  onClose: () => void
  onCreated: (t: Thread) => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<ForumCategory>(defaultCategory ?? 'condicoes')
  const [spotId, setSpotId] = useState<string | null>(defaultSpot)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, requireLogin } = useAuth()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user && !(await requireLogin())) return
    setBusy(true)
    setError(null)
    try {
      onCreated(await backend.forum.createThread({ title: title.trim(), body: body.trim(), category, spotId }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível publicar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: 'form', onSubmit: submit, sx: { borderRadius: '24px' } } as never }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Novo tópico</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} slotProps={{ htmlInput: { minLength: 3, maxLength: 140 } }} autoFocus />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Categoria" value={category} onChange={(e) => setCategory(e.target.value as ForumCategory)} sx={{ minWidth: 220 }}>
              {FORUM_CATEGORIES.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <SpotPicker
              value={SPOTS.find((s) => s.id === spotId) ?? null}
              onChange={(s) => setSpotId(s?.id ?? null)}
              allowEmpty
              locate={false}
              placeholder="Pico (opcional)"
              width="100%"
            />
          </Stack>
          <TextField
            label="Mensagem"
            required
            multiline
            minRows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 10000 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={busy}>
          Publicar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
