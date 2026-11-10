import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Bell, ChatLines, Star } from 'iconoir-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { backend, LEVEL_LABEL, MODALITY_LABEL, USERNAME_RE, type Level, type Modality } from '../backend'
import { LogoMark } from '../components/Logo'
import { SPOTS } from '../data/spots'
import { resetDemoAlerts } from '../hooks/useDemoAlerts'
import { setPendingFavorites, useFavorites } from '../hooks/useFavorites'
import { usePageMeta } from '../lib/meta'
import { alpha, brand } from '../theme'
import { DEFAULT_PREFS } from '../../supabase/functions/_shared/core/prefs.ts'

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, '')
    .slice(0, 24)

function Perk({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Stack direction="row" spacing={1.5}>
      <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: alpha(brand.green, 0.15), color: brand.deepGreen }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          {text}
        </Typography>
      </Box>
    </Stack>
  )
}

/** Cadastro: dados da conta, do surfista e picos favoritos. */
export default function SignUpPage() {
  const { user, ready } = useAuth()
  const { save } = useFavorites()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [touchedUser, setTouchedUser] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [modality, setModality] = useState<Modality>('surf')
  const [level, setLevel] = useState<Level>('intermediario')
  const [spots, setSpots] = useState<string[]>([])
  const [accept, setAccept] = useState(false)
  const [available, setAvailable] = useState<{ name: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)

  usePageMeta({
    title: 'Criar conta · OlhaOnda',
    description: 'Crie sua conta no OlhaOnda: fórum de cada pico, picos favoritos e avisos quando a previsão bater com o seu gosto.',
    path: '/cadastro',
  })

  // sugere o apelido a partir do nome até a pessoa mexer no campo
  const handle = touchedUser ? username : slug(name.split(' ')[0] ?? '')
  const validHandle = USERNAME_RE.test(handle)

  useEffect(() => {
    if (!validHandle) return
    let alive = true
    const t = setTimeout(() => {
      void backend.auth.usernameAvailable(handle).then((ok) => alive && setAvailable({ name: handle, ok }))
    }, 350)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [handle, validHandle])

  // já logado (e não acabou de se cadastrar aqui): vai para Meus picos
  if (ready && user && !confirm && !busy) return <Navigate to="/meus-picos" replace />

  const handleTaken = available?.name === handle && !available.ok
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validHandle || handleTaken) return setError('Escolha um apelido válido e livre.')
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.')
    setBusy(true)
    setError(null)
    try {
      const r = await backend.auth.signUp({ name, username: handle, email, password, city, modality, level })
      if (r.needsConfirmation) {
        setPendingFavorites(spots)
        setConfirm(email)
      } else {
        for (const id of spots) await save(id, DEFAULT_PREFS, true)
        const me = await backend.auth.current()
        if (me) resetDemoAlerts(me.id) // confere os alertas dos picos recém-favoritados
        navigate('/meus-picos?bemvindo=1')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setBusy(false)
    }
  }

  if (confirm)
    return (
      <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
        <LogoMark size={44} />
        <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
          Confirme seu e-mail
        </Typography>
        <Typography sx={{ mt: 1.5, opacity: 0.8 }}>
          Enviamos um link para <b>{confirm}</b>. Abra o e-mail e toque no link para ativar a conta. Seus picos favoritos já ficam salvos
          quando você entrar.
        </Typography>
      </Paper>
    )

  const toggleSx = {
    flexWrap: 'wrap',
    '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, borderRadius: '10px !important', m: 0.25, border: `1px solid ${alpha(brand.purple, 0.2)} !important` },
  } as const

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) minmax(0,1.3fr)' }, gap: { xs: 3, md: 5 }, alignItems: 'start' }}>
      <Stack spacing={3} sx={{ pt: { md: 4 } }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 42 } }}>
            Crie sua conta
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 1 }}>Grátis. Leva um minuto.</Typography>
        </Box>
        <Perk icon={<ChatLines width={20} height={20} />} title="Fórum de cada pico" text="Todo dia o OlhaOnda posta o resumo da previsão; a galera conta como o mar realmente está." />
        <Perk icon={<Star width={20} height={20} />} title="Seus picos favoritos" text="Diga o tamanho, o vento, a maré e o horário que você gosta em cada pico." />
        <Perk icon={<Bell width={20} height={20} />} title="Aviso quando bater" text="Quando a previsão combinar com o seu gosto, você recebe uma notificação." />
      </Stack>

      <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={2.25}>
          {error && <Alert severity="error">{error}</Alert>}
          {backend.mode === 'demo' && (
            <Alert severity="info" variant="outlined">
              Modo demonstração: a conta fica só neste navegador.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Nome" required fullWidth value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" slotProps={{ htmlInput: { maxLength: 60 } }} />
            <TextField
              label="Apelido"
              required
              fullWidth
              value={handle}
              onChange={(e) => {
                setTouchedUser(true)
                setUsername(slug(e.target.value))
              }}
              error={(!!handle && !validHandle) || handleTaken}
              helperText={
                !handle ? 'Como aparece no fórum' : !validHandle ? 'De 3 a 24: letras, números, ponto ou _' : handleTaken ? 'Já está em uso' : available?.name === handle ? 'Disponível' : ' '
              }
              slotProps={{ input: { startAdornment: <InputAdornment position="start">@</InputAdornment> } }}
            />
          </Stack>
          <TextField label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <TextField
            label="Senha"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText="Pelo menos 8 caracteres"
            error={!!password && password.length < 8}
          />
          <TextField label="Cidade onde você mora" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" slotProps={{ htmlInput: { maxLength: 60 } }} />

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

          <Autocomplete
            multiple
            options={SPOTS}
            groupBy={(s) => s.region ?? s.state}
            getOptionLabel={(s) => s.name}
            value={SPOTS.filter((s) => spots.includes(s.id))}
            onChange={(_, v) => setSpots(v.slice(0, 5).map((s) => s.id))}
            renderValue={(v, getItemProps) =>
              v.map((s, i) => {
                const { key, ...rest } = getItemProps({ index: i })
                return <Chip key={key} label={s.name} size="small" {...rest} />
              })
            }
            renderInput={(params) => <TextField {...params} label="Seus picos favoritos (até 5)" helperText="Depois você ajusta as condições preferidas de cada um" />}
          />

          <FormControlLabel
            control={<Checkbox checked={accept} onChange={(e) => setAccept(e.target.checked)} color="success" />}
            label={
              <Typography variant="body2">
                Li e aceito a{' '}
                <Link component={RouterLink} to="/privacidade" target="_blank">
                  política de privacidade
                </Link>{' '}
                e as regras do fórum (respeito, sem ofensas nem spam).
              </Typography>
            }
          />

          <Button type="submit" variant="contained" size="large" disabled={busy || !accept}>
            Criar conta
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
