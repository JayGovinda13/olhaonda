import { Alert, Box, Button, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { backend } from '../backend'
import { LogoMark } from '../components/Logo'
import { usePageMeta } from '../lib/meta'

/** Nova senha para quem perdeu a antiga: chega pelo link do e-mail e não pede a senha anterior. */
export default function ResetPasswordPage() {
  const { refresh, requireLogin } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState(() => backend.auth.recoveryActive())
  const [waited, setWaited] = useState(false)
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  usePageMeta({ title: 'Nova senha · OlhaOnda', description: 'Crie uma nova senha para a sua conta.', path: '/redefinir-senha' })

  // o Supabase confirma o link logo depois que a página abre: espera um instante antes de dizer que o link não vale
  useEffect(() => {
    const off = backend.auth.onRecovery(() => setActive(true))
    const t = setTimeout(() => setWaited(true), 3000)
    return () => {
      off()
      clearTimeout(t)
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next !== again) return setError('As duas senhas não são iguais.')
    setBusy(true)
    setError(null)
    try {
      await backend.auth.setNewPassword(next)
      await refresh()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a nova senha.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 480, mx: 'auto' }}>
      <LogoMark size={40} />
      <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
        Nova senha
      </Typography>

      {done ? (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alert severity="success">Senha alterada. Você já está dentro da sua conta.</Alert>
          <Box>
            <Button variant="contained" onClick={() => navigate('/', { replace: true })}>
              Ir para o OlhaOnda
            </Button>
          </Box>
        </Stack>
      ) : active ? (
        <Stack component="form" onSubmit={submit} spacing={2} sx={{ mt: 2 }}>
          <Typography sx={{ opacity: 0.75 }}>Escolha uma nova senha. Não precisa da antiga.</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nova senha" type="password" required autoFocus value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" helperText="Pelo menos 8 caracteres" />
          <TextField label="Confirmar nova senha" type="password" required value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          <Button type="submit" variant="contained" size="large" disabled={busy || !next || !again}>
            Salvar nova senha
          </Button>
        </Stack>
      ) : !waited ? (
        <Skeleton variant="rounded" height={160} sx={{ mt: 2, borderRadius: '18px' }} />
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alert severity="warning">
            Este link não vale mais: ele expira depois de um tempo e só funciona uma vez. Peça um novo em <b>Esqueci minha senha</b>.
          </Alert>
          <Box>
            <Button variant="contained" onClick={() => void requireLogin('Entre ou peça um novo link de redefinição.')}>
              Voltar ao login
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  )
}
