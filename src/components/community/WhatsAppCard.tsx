import { Alert, Box, Button, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import { ChatBubble } from 'iconoir-react'
import { useState } from 'react'
import { maskPhone, useWhatsApp } from '../../hooks/useWhatsApp'
import { alpha, brand } from '../../theme'

/** Liga o WhatsApp da pessoa: número → código recebido no próprio WhatsApp → avisos ligados. */
export function WhatsAppCard() {
  const wa = useWhatsApp()
  const { status } = wa
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dry, setDry] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState('')

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  const linked = status.phone != null
  return (
    <Paper id="whatsapp" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-start' } }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: alpha(linked && status.enabled ? brand.green : brand.plum, 0.14), color: linked && status.enabled ? brand.deepGreen : brand.plum, flexShrink: 0 }}>
          <ChatBubble width={22} height={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }}>{linked ? (status.enabled ? 'Avisos no WhatsApp ligados' : status.optedOut ? 'Você pediu para parar os avisos' : 'Avisos no WhatsApp pausados') : 'Receber os avisos no WhatsApp'}</Typography>

          {linked ? (
            <>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                {maskPhone(status.phone)} ·{' '}
                {status.enabled
                  ? 'Mandamos uma mensagem quando um pico favorito entra na sua condição, quando a previsão muda, quando sai (com o motivo) e quando volta.'
                  : status.optedOut
                    ? 'Você respondeu PARAR no WhatsApp. Ligue de novo aqui, ou responda VOLTAR lá.'
                    : 'Nenhuma mensagem será enviada enquanto estiver pausado.'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>
                Para parar a qualquer hora, responda PARAR no próprio WhatsApp.
              </Typography>
            </>
          ) : step === 'phone' ? (
            <>
              <Typography variant="body2" sx={{ opacity: 0.75, mb: 1.5 }}>
                Avisamos assim que a previsão dos próximos 7 dias bater com o seu gosto, e de novo se a condição mudar, sair ou voltar. Você confirma o número com um código que chega no próprio WhatsApp.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'flex-start' } }}>
                <TextField
                  size="small"
                  label="Seu WhatsApp com DDD"
                  placeholder="11 99999-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  autoComplete="tel"
                  slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 20 } }}
                  sx={{ flex: 1, maxWidth: 280 }}
                />
                <Button
                  variant="contained"
                  disabled={busy || !consent || phone.replace(/\D/g, '').length < 10}
                  onClick={() =>
                    void run(async () => {
                      const r = await wa.start(phone)
                      setSentTo(r.phone)
                      setDry(r.dryRunCode ?? null)
                      setStep('code')
                    })
                  }
                >
                  Enviar código
                </Button>
              </Stack>
              <Stack direction="row" sx={{ alignItems: 'center', mt: 1 }}>
                <Switch size="small" checked={consent} onChange={(e) => setConsent(e.target.checked)} color="success" slotProps={{ input: { 'aria-label': 'Aceito receber avisos no WhatsApp' } }} />
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Aceito receber avisos de previsão do OlhaOnda neste WhatsApp. Posso parar quando quiser.
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ opacity: 0.75, mb: 1.5 }}>
                Enviamos um código de 6 dígitos para {maskPhone(sentTo)}. Ele vale por 10 minutos.
              </Typography>
              {dry && (
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Ambiente de teste: nenhuma mensagem foi enviada de verdade. Use o código <b>{dry}</b>.
                </Alert>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'flex-start' } }}>
                <TextField
                  size="small"
                  label="Código"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6 } }}
                  sx={{ width: 160 }}
                />
                <Button
                  variant="contained"
                  disabled={busy || code.length !== 6}
                  onClick={() =>
                    void run(async () => {
                      await wa.verify(code)
                      setCode('')
                      setStep('phone')
                      setConsent(false)
                      setPhone('')
                    })
                  }
                >
                  Confirmar
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    setStep('phone')
                    setCode('')
                    setDry(null)
                  }}
                >
                  Trocar número
                </Button>
              </Stack>
            </>
          )}

          {error && (
            <Typography variant="body2" sx={{ color: brand.plum, fontWeight: 700, mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>

        {linked && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Switch checked={status.enabled} disabled={busy} color="success" onChange={(e) => void run(() => wa.setEnabled(e.target.checked))} slotProps={{ input: { 'aria-label': 'Avisos no WhatsApp' } }} />
            <Button disabled={busy} onClick={() => void run(() => wa.unlink())}>
              Desligar
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
