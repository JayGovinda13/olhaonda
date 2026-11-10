import { IconButton, Tooltip } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'
import { HalfMoon, SunLight } from 'iconoir-react'

/**
 * Alterna modo claro / noturno. Começa seguindo o sistema (celular no modo escuro = site escuro);
 * depois de tocar, a escolha fica salva neste aparelho.
 */
export function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme()
  if (!mode) return null // ainda montando
  const current = mode === 'system' ? systemMode : mode
  const dark = current === 'dark'
  const label = dark ? 'Mudar para o modo claro' : 'Mudar para o modo noturno'
  return (
    <Tooltip title={label}>
      <IconButton onClick={() => setMode(dark ? 'light' : 'dark')} aria-label={label} sx={{ color: 'text.primary' }}>
        {dark ? <SunLight width={20} height={20} /> : <HalfMoon width={20} height={20} />}
      </IconButton>
    </Tooltip>
  )
}
