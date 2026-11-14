import '@fontsource-variable/manrope'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { isChunkError, reloadOnce } from './lib/chunkReload'
import { theme } from './theme'

window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  reloadOnce()
})
window.addEventListener('unhandledrejection', (e) => {
  if (isChunkError(e.reason)) reloadOnce()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
