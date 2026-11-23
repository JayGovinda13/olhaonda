import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Lock } from 'iconoir-react'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { useAuth } from '../../auth/context'
import { alpha, brand } from '../../theme'

/** Teste fechado: só entra quem o administrador liberou. */
export function AccessGate({ children }: { children: ReactNode }) {
  const { user, ready, requireLogin } = useAuth()
  if (!ready) return <Skeleton variant="rounded" height={220} sx={{ borderRadius: '18px' }} />
  if (user?.approved) return <>{children}</>

  return (
    <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
      <Box sx={{ width: 52, height: 52, mx: 'auto', borderRadius: '16px', display: 'grid', placeItems: 'center', bgcolor: alpha(brand.plum, 0.12), color: brand.plum }}>
        <Lock width={26} height={26} />
      </Box>
      <Typography variant="h5" component="h1" sx={{ mt: 2, fontWeight: 800 }}>
        {user ? 'Seu acesso ainda não foi liberado' : 'Fórum e avisos em teste fechado'}
      </Typography>
      <Typography sx={{ mt: 1.5, opacity: 0.8 }}>
        {user
          ? 'Recebemos o seu cadastro. Neste teste só liberamos algumas pessoas por vez. Assim que o seu acesso for liberado, o fórum e os avisos aparecem aqui, sem precisar fazer nada.'
          : 'O fórum e os avisos de condição são só para quem foi convidado. A previsão continua aberta para todo mundo. Recebeu um link de convite? Abra-o para criar a conta. Já tem conta? Entre.'}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center', mt: 3 }}>
        {user ? (
          <Button component={RouterLink} to="/" variant="contained">
            Ver a previsão
          </Button>
        ) : (
          <>
            <Button variant="contained" onClick={() => void requireLogin('Entre para acessar o fórum e os avisos.')}>
              Entrar
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  )
}
