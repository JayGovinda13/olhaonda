import { Alert, Box, Container, Link, Skeleton, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { Link as RouterLink, Outlet } from 'react-router'
import { backend } from '../backend'
import { AdSlot } from '../components/AdSlot'
import { Header } from '../components/Header'
import { LogoMark } from '../components/Logo'

export function Layout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      {backend.mode === 'demo' && (
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
            <Link component={RouterLink} to="/forum" color="inherit" variant="body2">
              Fórum
            </Link>
            <Link component={RouterLink} to="/fotos/vender" color="inherit" variant="body2">
              Venda suas fotos
            </Link>
            <Link href="mailto:anuncie@olhaonda.com.br" color="inherit" variant="body2">
              Anuncie
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
