import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Paper, Skeleton, Stack, Switch, TextField, Typography } from '@mui/material'
import { Copy, EditPencil, ShareIos, Xmark } from 'iconoir-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { ALL_SPOTS } from '../data/spots'
import { backend, type AdminInvite, type AdminOverview, type AdminUser } from '../backend'
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

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 860, mx: 'auto' }}>
      <Box>
        <Typography variant="h4" component="h1">
          Administração
        </Typography>
        <Typography sx={{ opacity: 0.75 }}>
          O cadastro é só por convite: crie um link abaixo e mande para quem você quer no OlhaOnda. Quem entra por um link já nasce liberado, sem limite de pessoas.
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
                {data.members} liberados
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {pending} aguardando liberação
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

          <InvitesCard invites={data.invites} onChange={load} />

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
                      {u.invitedBy ? ` · convidado por ${u.invitedBy}` : ''}
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
                        disabled={busy === u.id}
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

const USE_OPTIONS: { label: string; value: number | null }[] = [
  { label: '1 pessoa', value: 1 },
  { label: '5 pessoas', value: 5 },
  { label: '20 pessoas', value: 20 },
  { label: 'Sem limite', value: null },
]
const DAY_OPTIONS: { label: string; value: number | null }[] = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: 'Sem prazo', value: null },
]

const inviteUrl = (code: string) => `${location.origin}/cadastro?convite=${code}`

function inviteStatus(i: AdminInvite): { text: string; ok: boolean } {
  if (i.revoked) return { text: 'cancelado', ok: false }
  if (i.expiresAt && new Date(i.expiresAt).getTime() <= Date.now()) return { text: 'venceu', ok: false }
  if (i.maxUses != null && i.uses >= i.maxUses) return { text: 'esgotado', ok: false }
  return { text: 'ativo', ok: true }
}

/** Links de convite: o cadastro só funciona por eles. */
function InvitesCard({ invites, onChange }: { invites: AdminInvite[]; onChange: () => Promise<void> }) {
  const [label, setLabel] = useState('')
  const [uses, setUses] = useState<number | null>(5)
  const [days, setDays] = useState<number | null>(30)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(code))
      setMsg('Link copiado. É só colar no WhatsApp ou onde quiser.')
    } catch {
      setMsg(inviteUrl(code))
    }
  }
  const share = async (code: string) => {
    try {
      await navigator.share({ title: 'Convite para o OlhaOnda', text: 'Entre no OlhaOnda, previsão de onda por pico:', url: inviteUrl(code) })
    } catch {
      /* a pessoa fechou a folha de compartilhar */
    }
  }
  const create = async () => {
    setBusy(true)
    setErr(null)
    try {
      const code = await backend.admin.createInvite({ label, maxUses: uses, validDays: days })
      setLabel('')
      await onChange()
      await copy(code)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível criar o convite.')
    } finally {
      setBusy(false)
    }
  }
  const revoke = async (code: string) => {
    setBusy(true)
    try {
      await backend.admin.revokeInvite(code)
      await onChange()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível cancelar.')
    } finally {
      setBusy(false)
    }
  }
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <Paper sx={{ p: 2 }}>
      <Typography sx={{ fontWeight: 800 }}>Links de convite</Typography>
      <Typography variant="body2" sx={{ opacity: 0.7, mb: 1.5 }}>
        Só entra quem tiver um link válido. Cada pessoa que se cadastra pelo link já fica liberada.
      </Typography>
      {err && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {err}
        </Alert>
      )}
      {msg && (
        <Alert severity="success" onClose={() => setMsg(null)} sx={{ mb: 1.5, wordBreak: 'break-all' }}>
          {msg}
        </Alert>
      )}
      <Stack spacing={1.25}>
        <TextField size="small" label="Para quem é (opcional)" placeholder="Ex.: galera do Boldró" value={label} onChange={(e) => setLabel(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            Quantas pessoas podem usar
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
            {USE_OPTIONS.map((o) => (
              <Chip key={o.label} label={o.label} clickable size="small" variant={uses === o.value ? 'filled' : 'outlined'} onClick={() => setUses(o.value)} sx={uses === o.value ? { bgcolor: brand.plum, color: brand.sand, fontWeight: 800, '&:hover': { bgcolor: brand.plum } } : { fontWeight: 700 }} />
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            Vale por
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
            {DAY_OPTIONS.map((o) => (
              <Chip key={o.label} label={o.label} clickable size="small" variant={days === o.value ? 'filled' : 'outlined'} onClick={() => setDays(o.value)} sx={days === o.value ? { bgcolor: brand.plum, color: brand.sand, fontWeight: 800, '&:hover': { bgcolor: brand.plum } } : { fontWeight: 700 }} />
            ))}
          </Stack>
        </Box>
        <Button variant="contained" disabled={busy} onClick={() => void create()} sx={{ alignSelf: 'flex-start' }}>
          Criar link e copiar
        </Button>
      </Stack>

      {invites.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {invites.map((i) => {
            const st = inviteStatus(i)
            return (
              <Box key={i.code} sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.25, borderRadius: '12px', bgcolor: alpha(brand.plum, 0.05), opacity: st.ok ? 1 : 0.6 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} noWrap>
                    {i.label || 'Convite sem nome'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    {st.text} · {i.uses}
                    {i.maxUses != null ? ` de ${i.maxUses}` : ''} {i.uses === 1 ? 'cadastro' : 'cadastros'}
                    {i.expiresAt ? ` · vale até ${new Date(i.expiresAt).toLocaleDateString('pt-BR')}` : ''}
                  </Typography>
                </Box>
                {st.ok && (
                  <>
                    <IconButton size="small" aria-label="Copiar link" onClick={() => void copy(i.code)}>
                      <Copy width={18} height={18} />
                    </IconButton>
                    {canShare && (
                      <IconButton size="small" aria-label="Compartilhar link" onClick={() => void share(i.code)}>
                        <ShareIos width={18} height={18} />
                      </IconButton>
                    )}
                    <IconButton size="small" aria-label="Cancelar convite" disabled={busy} onClick={() => void revoke(i.code)}>
                      <Xmark width={18} height={18} />
                    </IconButton>
                  </>
                )}
              </Box>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}
