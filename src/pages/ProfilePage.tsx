import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { backend, LEVEL_LABEL, MODALITY_LABEL, USERNAME_RE, type Level, type Modality, type Profile } from '../backend'
import { usePageMeta } from '../lib/meta'
import { alpha, brand } from '../theme'

/** Editar o perfil (dados do cadastro). */
export default function ProfilePage() {
  const { user, ready, refresh } = useAuth()
  usePageMeta({ title: 'Meu perfil · OlhaOnda', description: 'Seus dados no OlhaOnda.', path: '/perfil' })
  if (ready && !user) return <Navigate to="/cadastro" replace />
  if (!user) return null
  return (
    <Stack spacing={3} sx={{ maxWidth: 640, mx: 'auto' }}>
      {user.approved && <InviteCard />}
      <ProfileForm key={user.id} user={user} onSaved={refresh} />
      <PasswordSection user={user} />
      <DataRights />
    </Stack>
  )
}

/** Trocar a senha: pede a senha atual e a nova (duas vezes). */
function PasswordSection({ user }: { user: Profile }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  if (!user.email) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next !== again) return setMsg({ ok: false, text: 'As duas senhas novas não são iguais.' })
    setBusy(true)
    setMsg(null)
    try {
      await backend.auth.changePassword(current, next)
      setCurrent('')
      setNext('')
      setAgain('')
      setMsg({ ok: true, text: 'Senha alterada.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Não foi possível trocar a senha.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Typography variant="h6" component="h2">
        Senha
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
        Você entra com <b>{user.email}</b>.
      </Typography>
      {!user.hasPassword ? (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          Sua conta entra pelo Google, então não tem senha aqui. Para trocar, altere a senha da sua conta Google.
        </Alert>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {msg && <Alert severity={msg.ok ? 'success' : 'error'}>{msg.text}</Alert>}
          <TextField label="Senha atual" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          <TextField label="Nova senha" type="password" required value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" helperText="Pelo menos 8 caracteres" />
          <TextField label="Confirmar nova senha" type="password" required value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          <Box>
            <Button type="submit" variant="contained" disabled={busy || !current || !next || !again}>
              Trocar senha
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  )
}

/** LGPD: levar os próprios dados e excluir a conta, sem precisar pedir por e-mail. */
function DataRights() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const download = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const data = await backend.account.exportData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const a = Object.assign(document.createElement('a'), { href: url, download: 'meus-dados-olhaonda.json' })
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Não foi possível gerar o arquivo.' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await backend.account.deleteAccount()
      navigate('/', { replace: true })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Não foi possível excluir a conta.' })
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Typography variant="h6" component="h2">
        Seus dados (LGPD)
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
        Você pode levar uma cópia de tudo o que guardamos sobre você ou excluir a conta quando quiser. Mais detalhes na{' '}
        <Box component={RouterLink} to="/privacidade" sx={{ color: brand.plum, fontWeight: 700 }}>
          política de privacidade
        </Box>
        .
      </Typography>
      {msg && (
        <Alert severity={msg.ok ? 'success' : 'error'} sx={{ mt: 1.5 }}>
          {msg.text}
        </Alert>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
        <Button variant="outlined" disabled={busy} onClick={() => void download()}>
          Baixar meus dados
        </Button>
        <Button color="error" disabled={busy} onClick={() => setOpen(true)}>
          Excluir minha conta
        </Button>
      </Stack>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Excluir a conta?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Isso apaga o seu perfil, os favoritos, os avisos e o que você publicou no fórum. Não dá para desfazer. Digite <b>EXCLUIR</b> para confirmar.
          </Typography>
          <TextField fullWidth size="small" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={busy || confirm !== 'EXCLUIR'} onClick={() => void remove()}>
            Excluir para sempre
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

function ProfileForm({ user, onSaved }: { user: Profile; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username ?? '')
  const [city, setCity] = useState(user.city ?? '')
  const [modality, setModality] = useState<Modality>(user.modality ?? 'surf')
  const [level, setLevel] = useState<Level>(user.level ?? 'intermediario')
  const [bio, setBio] = useState(user.bio ?? '')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const handle = username.trim().toLowerCase()
    if (handle && !USERNAME_RE.test(handle)) return setMsg({ ok: false, text: 'Apelido: de 3 a 24 letras, números, ponto ou _.' })
    if (handle && handle !== user.username && !(await backend.auth.usernameAvailable(handle))) return setMsg({ ok: false, text: 'Esse apelido já está em uso.' })
    setBusy(true)
    try {
      await backend.auth.updateProfile({ name: name.trim(), username: handle || null, city: city.trim() || null, modality, level, bio: bio.trim() || null })
      await onSaved()
      setMsg({ ok: true, text: 'Perfil atualizado.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Não foi possível salvar.' })
    } finally {
      setBusy(false)
    }
  }

  const toggleSx = {
    flexWrap: 'wrap',
    '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, borderRadius: '10px !important', m: 0.25, border: `1px solid ${alpha(brand.purple, 0.2)} !important` },
  } as const

  return (
    <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2.5 }}>
        Meu perfil
      </Typography>
      <Stack spacing={2.25}>
        {msg && <Alert severity={msg.ok ? 'success' : 'error'}>{msg.text}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Nome" required fullWidth value={name} onChange={(e) => setName(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />
          <TextField
            label="Apelido"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24))}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">@</InputAdornment> } }}
          />
        </Stack>
        <TextField label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            Você pega onda de
          </Typography>
          <ToggleButtonGroup exclusive value={modality} onChange={(_, v) => v && setModality(v)} size="small" sx={toggleSx}>
            {(Object.keys(MODALITY_LABEL) as Modality[]).map((k) => (
              <ToggleButton key={k} value={k}>
                {MODALITY_LABEL[k]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            Nível
          </Typography>
          <ToggleButtonGroup exclusive value={level} onChange={(_, v) => v && setLevel(v)} size="small" sx={toggleSx}>
            {(Object.keys(LEVEL_LABEL) as Level[]).map((k) => (
              <ToggleButton key={k} value={k}>
                {LEVEL_LABEL[k]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <TextField label="Sobre você" multiline minRows={2} value={bio} onChange={(e) => setBio(e.target.value)} slotProps={{ htmlInput: { maxLength: 280 } }} helperText={`${bio.length}/280`} />
        <Box>
          <Button type="submit" variant="contained" disabled={busy}>
            Salvar
          </Button>
        </Box>
      </Stack>
    </Paper>
  )
}

/** O link de convite individual: cada pessoa liberada convida amigos pelo seu. */
function InviteCard() {
  const [inv, setInv] = useState<{ code: string; uses: number; maxUses: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    backend.invites
      .mine()
      .then((r) => alive && setInv(r))
      .catch((e: unknown) => alive && setErr(e instanceof Error ? e.message : 'Não foi possível carregar o seu link.'))
    return () => {
      alive = false
    }
  }, [])
  const full = !!inv && inv.uses >= inv.maxUses
  const url = inv ? `${location.origin}/cadastro?convite=${inv.code}` : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setMsg('Link copiado.')
    } catch {
      setMsg('Copie o link acima.')
    }
  }
  const share = async () => {
    try {
      await navigator.share({ title: 'Convite para o OlhaOnda', text: 'Entre no OlhaOnda, previsão de onda por pico:', url })
    } catch {
      /* a pessoa fechou a folha de compartilhar */
    }
  }
  const renew = async () => {
    if (!full && !window.confirm('Gerar um novo link? O link atual deixa de funcionar (quem já entrou continua).')) return
    try {
      setInv(await backend.invites.renew())
      setMsg('Novo link gerado.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível gerar outro link.')
    }
  }
  return (
    <Paper id="convite" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Typography variant="h6" component="h2">
        Convide seus amigos
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
        O OlhaOnda é só por convite. Este é o seu link: quem se cadastrar por ele entra direto, sem esperar liberação. Cada link vale para 10 pessoas; depois é só gerar outro.
      </Typography>
      {err && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {err}
        </Alert>
      )}
      {inv && (
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          <TextField size="small" value={url} fullWidth slotProps={{ input: { readOnly: true }, htmlInput: { 'aria-label': 'Seu link de convite', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select() } }} />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {!full && (
              <Button variant="contained" onClick={() => void copy()}>
                Copiar link
              </Button>
            )}
            {!full && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <Button variant="outlined" onClick={() => void share()}>
                Compartilhar
              </Button>
            )}
            <Button variant={full ? 'contained' : 'text'} onClick={() => void renew()}>
              Gerar outro
            </Button>
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            {full
              ? 'Esse link já foi usado 10 vezes e não funciona mais. Gere outro para convidar mais gente.'
              : `${inv.uses} de ${inv.maxUses} usos. Se a sua conta for bloqueada, o link para de valer.`}
          </Typography>
          {msg && <Typography variant="caption" sx={{ color: brand.deepGreen, fontWeight: 700 }}>{msg}</Typography>}
        </Stack>
      )}
    </Paper>
  )
}
