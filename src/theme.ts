import { createTheme, alpha as muiAlpha } from '@mui/material/styles'

/** Paleta oficial OlhaOnda (valores fixos: mapas, canvas e o card verde usam estes). */
export const fixed = {
  purple: '#4B1D5A', // texto, marca
  plum: '#7A2E6E', // secundária, destaques
  deepGreen: '#0F4C3A', // painéis escuros, "mar profundo"
  green: '#2FAE7B', // dados bons, ação
  sand: '#F5E6D3', // fundo
} as const

/**
 * Cores da marca como variáveis CSS: mudam sozinhas entre o modo claro e o noturno.
 * No noturno o "roxo" (tinta do texto) fica claro e a "areia" (fundo) fica escura,
 * então elementos "roxo com texto areia" (chips selecionados) se invertem e continuam legíveis.
 */
export const brand = {
  purple: 'var(--oo-purple)',
  plum: 'var(--oo-plum)',
  deepGreen: 'var(--oo-deep)',
  green: 'var(--oo-green)',
  sand: 'var(--oo-sand)',
} as const

/** Transparência que funciona também com as variáveis CSS (color-mix). */
export function alpha(color: string, value: number) {
  if (color.startsWith('var(')) return `color-mix(in srgb, ${color} ${Math.round(value * 1000) / 10}%, transparent)`
  return muiAlpha(color, value)
}

const NIGHT = {
  purple: '#EADCF0',
  plum: '#D9A2D3',
  deepGreen: '#7BD9AE',
  green: '#3CC48D',
  sand: '#16111B',
  paper: '#231A2A',
}

const VARS = {
  light: {
    '--oo-purple': fixed.purple,
    '--oo-plum': fixed.plum,
    '--oo-deep': fixed.deepGreen,
    '--oo-green': fixed.green,
    '--oo-sand': fixed.sand,
    '--oo-paper': 'rgba(251,244,236,.8)',
    '--oo-paper-solid': '#FBF4EC',
    '--oo-shadow': 'rgba(75,29,90,.22)',
    '--oo-bg': 'url(/bg-sun.svg), url(/bg-waves-tile.svg)',
  },
  dark: {
    '--oo-purple': NIGHT.purple,
    '--oo-plum': NIGHT.plum,
    '--oo-deep': NIGHT.deepGreen,
    '--oo-green': NIGHT.green,
    '--oo-sand': NIGHT.sand,
    '--oo-paper': 'rgba(35,26,42,.86)',
    '--oo-paper-solid': NIGHT.paper,
    '--oo-shadow': 'rgba(0,0,0,.5)',
    '--oo-bg': 'url(/bg-sun-dark.svg), url(/bg-waves-tile-dark.svg)',
  },
}

export const theme = createTheme({
  // modo claro/noturno pela classe .light/.dark no <html> (definida antes de pintar, em index.html)
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: fixed.purple, contrastText: fixed.sand },
        secondary: { main: fixed.plum, contrastText: fixed.sand },
        success: { main: fixed.green, dark: fixed.deepGreen, contrastText: '#fff' },
        background: { default: fixed.sand, paper: '#FBF4EC' },
        text: { primary: fixed.purple, secondary: muiAlpha(fixed.purple, 0.66) },
        divider: muiAlpha(fixed.purple, 0.12),
      },
    },
    dark: {
      palette: {
        primary: { main: NIGHT.purple, contrastText: NIGHT.sand },
        secondary: { main: NIGHT.plum, contrastText: NIGHT.sand },
        success: { main: NIGHT.green, dark: '#1E8A5E', contrastText: '#fff' },
        background: { default: NIGHT.sand, paper: NIGHT.paper },
        text: { primary: NIGHT.purple, secondary: muiAlpha(NIGHT.purple, 0.68) },
        divider: muiAlpha(NIGHT.purple, 0.12),
      },
    },
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
        ':root, :root.light': VARS.light,
        ':root.dark': { ...VARS.dark, colorScheme: 'dark' },
        // mapas continuam claros (cores fixas), só um pouco mais escuros à noite para não ofuscar
        ':root.dark .maplibregl-canvas': { filter: 'brightness(0.78) saturate(0.9)' },
        body: {
          backgroundColor: brand.sand,
          // sol fixo no canto superior direito + ondas pequenas repetidas em diagonal
          // (gerados por scripts/gen-wave.mjs; versões -dark para o modo noturno)
          backgroundImage: 'var(--oo-bg)',
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
          backgroundColor: 'var(--oo-paper)',
          backdropFilter: 'blur(3px)',
        },
      },
    },
    // Camadas sobrepostas (listas, menus, diálogos) precisam ser opacas para ficarem legíveis
    MuiAutocomplete: { styleOverrides: { paper: { backgroundColor: 'var(--oo-paper-solid)', backdropFilter: 'none' } } },
    MuiPopover: { styleOverrides: { paper: { backgroundColor: 'var(--oo-paper-solid)', backdropFilter: 'none' } } },
    MuiDialog: { styleOverrides: { paper: { backgroundColor: 'var(--oo-paper-solid)', backdropFilter: 'none' } } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: brand.purple, color: brand.sand, fontSize: 12, borderRadius: 8 },
      },
    },
  },
})
