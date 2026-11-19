import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Paper, Skeleton, Stack, Switch, TextField, Typography } from '@mui/material'
import { EditPencil } from 'iconoir-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { ALL_SPOTS } from '../data/spots'
import { backend, type AdminOverview, type AdminUser } from '../backend'
import { usePageMeta } from '../lib/meta'
import { timeAgo } from '../lib/time'
import { alpha, brand } from '../theme'

type Filter = 'pending' | 'members' | 'all'

/** Administração do teste fechado: libera e bloqueia o acesso de cada pessoa. */
export default function AdminPage() {
  const { user, ready } = useAuth()
  usePageMeta({ title: 'Administração · OlhaOnda', description: 'Liberar o acesso ao fórum e aos avisos.', path: '/admin' })
  if (ready && !user?.isAdmin) return <Navigate to="/" replace />
  if (!user) return null
  return <AdminPanel />
}

function AdminPanel() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('pending')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<AdminUser | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await backend.admin.overview())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar.')
    }
  }, [])
  useEffect(() => {
    let alive = true
    backend.admin
      .overview()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'Não foi possível carregar.'))
    return () => {
      alive = false
    }
  }, [])

  const toggle = async (u: AdminUser, allow: boolean) => {
    setBusy(u.id)
    try {
      await backend.admin.setAccess(u.id, allow)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setBusy(null)
    }
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data?.users ?? [])
      .filter((u) => (filter === 'all' ? true : filter === 'pending' ? !u.approvedAt && u.role === 'user' : !!u.approvedAt || u.role !== 'user'))
      .filter((u) => !term || [u.name, u.username ?? '', u.email, u.city ?? ''].some((x) => x.toLowerCase().includes(term)))
  }, [data, filter, q])

  const pending = data?.users.filter((u) => !u.approvedAt && u.role === 'user').length ?? 0
  const full = data?.limit != null && data.members >= data.limit

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 860, mx: 'auto' }}>
      <Box>
        <Typography variant="h4" component="h1">
          Administração
        </Typography>
        <Typography sx={{ opacity: 0.75 }}>
          Quem você liberar passa a ver o fórum e a receber os avisos. As pessoas se cadastram sozinhas e ficam aguardando aqui.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {!data ? (
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: '18px' }} />
      ) : (
        <>
          <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 22 }}>
                {data.members}
                {data.limit != null ? ` de ${data.limit}` : ''} liberados
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {full ? 'Limite atingido: bloqueie alguém para liberar outra pessoa.' : `${pending} aguardando liberação`}
                {!data.inviteOnly && ' · O app está aberto a todos (convite desligado).'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75}>
              {(
                [
                  ['pending', `Aguardando (${pending})`],
                  ['members', 'Liberados'],
                  ['all', 'Todos'],
                ] as const
              ).map(([k, label]) => (
                <Chip
                  key={k}
                  label={label}
                  clickable
                  variant={filter === k ? 'filled' : 'outlined'}
                  onClick={() => setFilter(k)}
                  sx={filter === k ? { bgcolor: brand.plum, color: brand.sand, fontWeight: 800, '&:hover': { bgcolor: brand.plum } } : { fontWeight: 700 }}
                />
              ))}
            </Stack>
          </Paper>

          {data.topSpots.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Praias mais favoritadas</Typography>
              <Stack spacing={0.5}>
                {data.topSpots.slice(0, 10).map((t, i) => {
                  const spot = ALL_SPOTS.find((x) => x.id === t.spotId)
                  return (
                    <Stack key={t.spotId} direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                      <Typography variant="body2" sx={{ width: 22, opacity: 0.55, fontWeight: 700 }}>
                        {i + 1}.
                      </Typography>
                      <Typography sx={{ flex: 1, fontWeight: 700 }} noWrap>
                        {spot ? spot.name : t.spotId}
                        {spot ? <Box component="span" sx={{ opacity: 0.55, fontWeight: 500 }}> · {spot.city}</Box> : null}
                      </Typography>
                      <Typography sx={{ fontWeight: 800 }}>{t.count}</Typography>
                    </Stack>
                  )
                })}
              </Stack>
            </Paper>
          )}

          <TextField size="small" placeholder="Buscar por nome, apelido, e-mail ou cidade" value={q} onChange={(e) => setQ(e.target.value)} fullWidth />

          <Stack spacing={1}>
            {list.length === 0 && (
              <Typography sx={{ opacity: 0.65, py: 3, textAlign: 'center' }}>
                {filter === 'pending' ? 'Ninguém aguardando liberação.' : 'Nenhuma pessoa encontrada.'}
              </Typography>
            )}
            {list.map((u) => {
              const staff = u.role !== 'user'
              return (
                <Paper key={u.id} sx={{ p: 1.75, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>
                      {u.name}
                      {u.username ? <Box component="span" sx={{ opacity: 0.55, fontWeight: 600 }}> @{u.username}</Box> : null}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.75, wordBreak: 'break-all' }}>
                      {u.email}
                      {u.city ? ` · ${u.city}` : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.55 }}>
                      cadastro {timeAgo(u.createdAt)}
                      {!u.emailConfirmed && ' · e-mail ainda não confirmado'}
                    </Typography>
                  </Box>
                  <IconButton size="small" aria-label={`Editar ${u.name}`} onClick={() => setEditing(u)}>
                    <EditPencil width={18} height={18} />
                  </IconButton>
                  {staff ? (
                    <Chip size="small" label={u.role === 'admin' ? 'Administrador' : 'Moderador'} sx={{ bgcolor: alpha(brand.plum, 0.12), fontWeight: 700 }} />
                  ) : (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.8 }}>
                        {u.approvedAt ? 'Liberado' : 'Bloqueado'}
                      </Typography>
                      <Switch
                        checked={!!u.approvedAt}
                        disabled={busy === u.id || (!u.approvedAt && full)}
                        color="success"
                        onChange={(e) => void toggle(u, e.target.checked)}
                        slotProps={{ input: { 'aria-label': `Liberar ${u.name}` } }}
                      />
                    </Stack>
                  )}
                </Paper>
              )
            })}
          </Stack>

          {data.audit.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Últimas liberações</Typography>
              <Stack spacing={0.5}>
                {data.audit.map((a, i) => (
                  <Typography key={i} variant="body2" sx={{ opacity: 0.8 }}>
                    {timeAgo(a.at)} · {a.admin ?? 'conta removida'} {a.action} {a.target ?? 'uma conta removida'}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          )}
          <Button onClick={() => void load()} sx={{ alignSelf: 'flex-start' }}>
            Atualizar lista
          </Button>
          {editing && (
            <EditDialog
              key={editing.id}
              user={editing}
              onClose={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null)
                await load()
              }}
            />
          )}
        </>
      )}
    </Stack>
  )
}

/** Editar o nome e o apelido de uma pessoa. */
function EditDialog({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await backend.admin.updateProfile(user.id, name, username.trim() || null)
      await onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar pessoa</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.7, wordBreak: 'break-all' }}>
            {user.email}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nome" required value={name} onChange={(e) => setName(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} autoFocus />
          <TextField
            label="Apelido"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24))}
            helperText="De 3 a 24 letras minúsculas, números, ponto ou _. Deixe vazio para ficar sem apelido."
            slotProps={{ input: { startAdornment: <InputAdornment position="start">@</InputAdornment> } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={busy || !name.trim()} onClick={() => void save()}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
