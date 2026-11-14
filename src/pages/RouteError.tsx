import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Link as RouterLink, useRouteError } from 'react-router'
import { isChunkError, reloadOnce } from '../lib/chunkReload'

/** Tela de erro amigável. Se for só o site que atualizou, recarrega sozinho. */
export default function RouteError() {
  const error = useRouteError()
  const stale = isChunkError(error)
  useEffect(() => {
    if (stale) reloadOnce()
  }, [stale])

  return (
    <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 520, mx: 'auto', mt: 4, textAlign: 'center' }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
        {stale ? 'Atualizando o OlhaOnda…' : 'Algo deu errado'}
      </Typography>
      <Typography sx={{ mt: 1.5, opacity: 0.8 }}>
        {stale
          ? 'O site acabou de ser atualizado. Se a página não recarregar sozinha, toque no botão.'
          : 'Não foi possível abrir esta página. Tente recarregar. Se continuar, volte para a previsão.'}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center', mt: 3 }}>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
        <Box component={RouterLink} to="/" sx={{ alignSelf: 'center', fontWeight: 700 }}>
          Ir para a previsão
        </Box>
      </Stack>
    </Paper>
  )
}
