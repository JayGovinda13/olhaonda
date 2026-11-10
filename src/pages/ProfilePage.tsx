import { Alert, Box, Button, InputAdornment, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { backend, LEVEL_LABEL, MODALITY_LABEL, USERNAME_RE, type Level, type Modality, type Profile } from '../backend'
import { usePageMeta } from '../lib/meta'
import { brand } from '../theme'

/** Editar o perfil (dados do cadastro). */
export default function ProfilePage() {
  const { user, ready, refresh } = useAuth()
  usePageMeta({ title: 'Meu perfil · OlhaOnda', description: 'Seus dados no OlhaOnda.', path: '/perfil' })
  if (ready && !user) return <Navigate to="/cadastro" replace />
  if (!user) return null
  return <ProfileForm key={user.id} user={user} onSaved={refresh} />
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
    <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 640, mx: 'auto' }}>
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
