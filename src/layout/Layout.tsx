import { Alert, Box, Container, Link, Skeleton, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { Link as RouterLink, Outlet } from 'react-router'
import { backend } from '../backend'
import { APP_ENV, FEATURES, HAS_COMMUNITY } from '../config/env'
import { AdSlot } from '../components/AdSlot'
import { Header } from '../components/Header'
import { LogoMark } from '../components/Logo'

export function Layout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {APP_ENV !== 'production' && (
        <Box
          role="note"
          sx={{
            bgcolor: APP_ENV === 'staging' ? '#7A2E6E' : '#0F4C3A',
            color: '#F5E6D3',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '.08em',
            py: 0.5,
          }}
        >
          {APP_ENV === 'staging' ? 'STAGING · ambiente de testes, pagamentos de teste' : 'DESENVOLVIMENTO · local'}
        </Box>
      )}
      <Header />
      {HAS_COMMUNITY && backend.mode === 'demo' && (
        <Alert severity="info" sx={{ borderRadius: 0, py: 0, justifyContent: 'center', '& .MuiAlert-message': { fontSize: 13 } }}>
          Modo demonstração: fórum e fotos guardam dados só neste navegador.
        </Alert>
      )}
      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Suspense
          fallback={
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: '18px' }} />
              <Skeleton variant="rounded" height={320} sx={{ borderRadius: '18px' }} />
            </Stack>
          }
        >
          <Outlet />
        </Suspense>
        <Box sx={{ mt: 4 }}>
          <AdSlot format="leaderboard" seed={1} />
        </Box>
      </Container>

      <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 }, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <LogoMark size={22} />
          <Typography variant="body2" sx={{ opacity: 0.7, flex: 1, minWidth: 240 }}>
            Previsão de ondas para o litoral brasileiro. Dados:{' '}
            <Link href="https://open-meteo.com/" target="_blank" rel="noopener" color="inherit">
              Open-Meteo
            </Link>{' '}
            (ECMWF WAM, Météo-France MFWAM, NOAA GFS-Wave), CC BY 4.0.
          </Typography>
          <Stack direction="row" spacing={2}>
            {FEATURES.forum && (
              <Link component={RouterLink} to="/forum" color="inherit" variant="body2">
                Fórum
              </Link>
            )}
            {FEATURES.photos && (
              <Link component={RouterLink} to="/fotos/vender" color="inherit" variant="body2">
                Venda suas fotos
              </Link>
            )}
            <Link href="mailto:anuncie@olhaonda.com.br" color="inherit" variant="body2">
              Anuncie
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
