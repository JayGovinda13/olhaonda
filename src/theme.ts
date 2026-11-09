import { alpha, createTheme } from '@mui/material/styles'

/** Paleta oficial OlhaOnda. */
export const brand = {
  purple: '#4B1D5A', // texto, marca
  plum: '#7A2E6E', // secundária, destaques
  deepGreen: '#0F4C3A', // painéis escuros, "mar profundo"
  green: '#2FAE7B', // dados bons, ação
  sand: '#F5E6D3', // fundo
} as const

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brand.purple, contrastText: brand.sand },
    secondary: { main: brand.plum, contrastText: brand.sand },
    success: { main: brand.green, dark: brand.deepGreen, contrastText: '#fff' },
    background: { default: brand.sand, paper: '#FBF4EC' },
    text: { primary: brand.purple, secondary: alpha(brand.purple, 0.66) },
    divider: alpha(brand.purple, 0.12),
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Manrope Variable", "Manrope", system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.04em' },
    h2: { fontWeight: 800, letterSpacing: '-0.035em' },
    h3: { fontWeight: 800, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    overline: { fontWeight: 700, letterSpacing: '0.12em' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.sand,
          // sol fixo no canto superior direito + ondas pequenas repetidas em diagonal
          // (gerados por scripts/gen-wave.mjs)
          backgroundImage: 'url(/bg-sun.svg), url(/bg-waves-tile.svg)',
          backgroundRepeat: 'no-repeat, repeat',
          backgroundAttachment: 'fixed, fixed',
          backgroundPosition: 'right 4vw top 72px, 0 0',
          backgroundSize: 'clamp(110px, 16vw, 220px) auto, 300px 300px',
          '@media (max-width: 600px)': { backgroundSize: '90px auto, 220px 220px', backgroundPosition: 'right -34px top 52px, 0 0' },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha(brand.purple, 0.08)}`,
          // translúcido: a onda do fundo aparece de leve atrás dos cards
          backgroundColor: alpha('#FBF4EC', 0.8),
          backdropFilter: 'blur(3px)',
        },
      },
    },
    // Camadas sobrepostas (listas, menus, diálogos) precisam ser opacas para ficarem legíveis
    MuiAutocomplete: { styleOverrides: { paper: { backgroundColor: '#FBF4EC', backdropFilter: 'none' } } },
    MuiPopover: { styleOverrides: { paper: { backgroundColor: '#FBF4EC', backdropFilter: 'none' } } },
    MuiDialog: { styleOverrides: { paper: { backgroundColor: '#FBF4EC', backdropFilter: 'none' } } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: brand.purple, color: brand.sand, fontSize: 12, borderRadius: 8 },
      },
    },
  },
})
