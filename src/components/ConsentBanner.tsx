import { Box, Button, Link, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { ADS_ENABLED } from '../config/ads'
import { consentStore, useConsent, type Consent } from '../lib/consent'
import { brand } from '../theme'

/**
 * Aviso de cookies (LGPD). Aparece só quando há anúncios do Google configurados
 * e o visitante ainda não escolheu. Nenhum script de anúncio carrega antes da escolha.
 */
export function ConsentBanner() {
  const consent = useConsent()
  if (!ADS_ENABLED || consent) return null

  const choose = (v: Exclude<Consent, null>) => {
    // se o AdSense já carregou (mudança de escolha), recarrega para valer a nova opção
    const loaded = Boolean((window as unknown as { adsbygoogle?: { loaded?: boolean } }).adsbygoogle?.loaded)
    consentStore.set(v)
    if (loaded) location.reload()
  }

  return (
    <Paper
      role="dialog"
      aria-label="Cookies e anúncios"
      sx={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        width: 'min(720px, calc(100% - 32px))',
        p: { xs: 2, sm: 2.5 },
        zIndex: 30,
        bgcolor: '#FBF4EC',
        backdropFilter: 'none',
        boxShadow: '0 12px 40px rgba(75,29,90,.22)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>Cookies e anúncios</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            O OlhaOnda é gratuito graças aos anúncios do Google, que usam cookies. Você escolhe se eles podem ser
            personalizados.{' '}
            <Link component={RouterLink} to="/privacidade" color="secondary" sx={{ fontWeight: 700 }}>
              Política de privacidade
            </Link>
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} sx={{ flexShrink: 0 }}>
          <Button variant="outlined" onClick={() => choose('denied')} sx={{ borderRadius: 99 }}>
            Só não personalizados
          </Button>
          <Button
            variant="contained"
            onClick={() => choose('granted')}
            sx={{ borderRadius: 99, bgcolor: brand.purple }}
          >
            Aceitar
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
