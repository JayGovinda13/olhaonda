import { Alert, Avatar, Box, Button, Chip, IconButton, Paper, Skeleton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { ArrowLeft, Send, Trash } from 'iconoir-react'
import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useParams } from 'react-router'
import { useAuth } from '../../auth/context'
import { backend, FORUM_CATEGORIES, type Post, type Thread } from '../../backend'
import { AdSlot } from '../../components/AdSlot'
import { SPOTS } from '../../data/spots'
import { timeAgo } from '../../lib/time'
import { brand } from '../../theme'

function Message({ name, at, body, onDelete }: { name: string; at: string; body: string; onDelete?: () => void }) {
  return (
    <Stack direction="row" spacing={1.5}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: brand.plum, color: brand.sand, fontWeight: 800, fontSize: 15 }}>
        {name.slice(0, 1).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <Typography sx={{ fontWeight: 800 }}>{name}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {timeAgo(at)}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {onDelete && (
            <Tooltip title="Apagar">
              <IconButton size="small" onClick={onDelete} aria-label="Apagar mensagem">
                <Trash width={16} height={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 0.5 }}>{body}</Typography>
      </Box>
    </Stack>
  )
}

export default function ThreadPage() {
  const { id = '' } = useParams()
  const [data, setData] = useState<{ id: string; thread: Thread; posts: Post[] } | null | 'missing'>(null)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, requireLogin } = useAuth()

  useEffect(() => {
    let alive = true
    backend.forum.getThread(id).then((r) => {
      if (!alive) return
      setData(r ? { id, ...r } : 'missing')
      if (r) document.title = `${r.thread.title} · Fórum OlhaOnda`
    })
    return () => {
      alive = false
    }
  }, [id])

  const current = data && data !== 'missing' && data.id === id ? data : null

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!current || !reply.trim()) return
    if (!(await requireLogin('Entre para responder no fórum.'))) return
    setBusy(true)
    setError(null)
    try {
      const p = await backend.forum.reply(id, reply.trim())
      setData({ ...current, posts: [...current.posts, p], thread: { ...current.thread, replyCount: current.thread.replyCount + 1 } })
      setReply('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível responder.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (postId: string) => {
    if (!current || !confirm('Apagar esta mensagem?')) return
    try {
      await backend.forum.deletePost(postId)
      setData({ ...current, posts: current.posts.filter((p) => p.id !== postId) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível apagar.')
    }
  }

  if (data === 'missing') {
    return (
      <Alert severity="warning" action={<Button component={RouterLink} to="/forum">Voltar</Button>}>
        Tópico não encontrado.
      </Alert>
    )
  }

  const t = current?.thread
  const spot = t?.spotId ? SPOTS.find((s) => s.id === t.spotId) : null

  return (
    <Stack spacing={2}>
      <Box>
        <Button component={RouterLink} to="/forum" startIcon={<ArrowLeft width={16} height={16} />} size="small">
          Fórum
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 2.5, sm: 4 } }}>
        {!t ? (
          <>
            <Skeleton width="70%" height={44} />
            <Skeleton width="40%" />
            <Skeleton height={100} />
          </>
        ) : (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
              <Chip size="small" label={FORUM_CATEGORIES.find((c) => c.id === t.category)?.label} />
              {spot && (
                <Chip size="small" variant="outlined" component={RouterLink} to={`/pico/${spot.id}`} clickable label={`Previsão de ${spot.name}`} />
              )}
            </Stack>
            <Typography variant="h4" component="h1" sx={{ mb: 3, overflowWrap: 'anywhere' }}>
              {t.title}
            </Typography>
            <Message name={t.authorName} at={t.createdAt} body={t.body} />
          </>
        )}
      </Paper>

      {current?.posts.map((p, i) => (
        <Fragment key={p.id}>
          <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Message name={p.authorName} at={p.createdAt} body={p.body} onDelete={user?.id === p.authorId ? () => void remove(p.id) : undefined} />
          </Paper>
          {i === 2 && <AdSlot format="inline" seed={i} />}
        </Fragment>
      ))}

      {error && <Alert severity="error">{error}</Alert>}

      {current && (
        <Paper component="form" onSubmit={send} sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={1.5}>
            <TextField
              placeholder={user ? 'Escreva sua resposta' : 'Entre para responder'}
              multiline
              minRows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onFocus={() => !user && void requireLogin('Entre para responder no fórum.')}
              slotProps={{ htmlInput: { maxLength: 10000, 'aria-label': 'Resposta' } }}
            />
            <Box>
              <Button type="submit" variant="contained" disabled={busy || !reply.trim()} endIcon={<Send width={16} height={16} />}>
                Responder
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
