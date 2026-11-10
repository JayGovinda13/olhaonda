import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Lock, Mail, Xmark } from 'iconoir-react'
import { useState, type FormEvent } from 'react'
import { backend } from '../backend'
import { LogoMark } from '../components/Logo'

/** O diálogo fica fora do roteador: navega pelo History API e avisa o React Router. */
function softNavigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function SignInDialog({ open, reason, onClose }: { open: boolean; reason?: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magic, setMagic] = useState(false)
  const [quick, setQuick] = useState(false)
  const [name, setName] = useState('')
  const [photographer, setPhotographer] = useState(false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const demo = backend.mode === 'demo'

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }

  const submitEmail = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      if (magic) {
        await backend.auth.signInWithEmail(email.trim())
        setSent(true)
      } else await backend.auth.signInWithPassword(email.trim(), password)
    })
  }

  const submitDemo = (e: FormEvent) => {
    e.preventDefault()
    void run(() => backend.auth.signInDemo!(name.trim() || 'Surfista', photographer))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: '24px' } } }}>
      <IconButton onClick={onClose} aria-label="Fechar" sx={{ position: 'absolute', right: 12, top: 12 }}>
        <Xmark width={20} height={20} />
      </IconButton>
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Box>
            <LogoMark size={36} />
            <Typography variant="h5" sx={{ mt: 2 }}>
              Entrar no OlhaOnda
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
              {reason ?? 'Para participar do fórum, comprar ou vender fotos.'}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {sent ? (
            <Alert severity="success">
              Enviamos um link de acesso para <b>{email}</b>. Abra seu e-mail neste aparelho para entrar.
            </Alert>
          ) : demo && quick ? (
            <Box component="form" onSubmit={submitDemo}>
              <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                Entrada rápida de demonstração: nenhum dado sai do seu navegador.
              </Alert>
              <Stack spacing={1.5}>
                <TextField label="Seu nome ou apelido" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <FormControlLabel
                  control={<Switch checked={photographer} onChange={(e) => setPhotographer(e.target.checked)} color="success" />}
                  label="Sou fotógrafo e quero vender fotos"
                />
                <Button type="submit" variant="contained" size="large" disabled={busy}>
                  Entrar
                </Button>
                <Button onClick={() => setQuick(false)}>Voltar</Button>
              </Stack>
            </Box>
          ) : (
            <>
              {!demo && (
                <>
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={busy}
                    onClick={() => void run(() => backend.auth.signInWithGoogle())}
                    startIcon={<GoogleG />}
                  >
                    Continuar com Google
                  </Button>
                  <Divider sx={{ fontSize: 12, opacity: 0.7 }}>ou</Divider>
                </>
              )}
              <Box component="form" onSubmit={submitEmail}>
                <Stack spacing={1.5}>
                  <TextField
                    type="email"
                    label="E-mail"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {!magic && (
                    <TextField
                      type="password"
                      label="Senha"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={busy}
                    startIcon={magic ? <Mail width={18} height={18} /> : <Lock width={18} height={18} />}
                  >
                    {magic ? 'Receber link de acesso' : 'Entrar'}
                  </Button>
                  {!demo && (
                    <Button size="small" onClick={() => setMagic((m) => !m)}>
                      {magic ? 'Entrar com senha' : 'Esqueci a senha / entrar sem senha'}
                    </Button>
                  )}
                </Stack>
              </Box>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  Ainda não tem conta?
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    onClose()
                    softNavigate('/cadastro')
                  }}
                >
                  Criar conta grátis
                </Button>
                {demo && (
                  <Button size="small" onClick={() => setQuick(true)}>
                    Entrada rápida (demonstração)
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  )
}
