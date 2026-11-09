import { alpha, createTheme } from '@mui/material/styles'

/** Paleta oficial OlhaOnda. */
export const brand = {
  purple: '#4B1D5A', // texto, marca
  plum: '#7A2E6E', // secundária, destaques
  deepGreen: '#0F4C3A', // painéis escuros, "mar profundo"
  green: '#2FAE7B', // dados bons, ação
  sand: '#F5E6D3', // fundo
} as const

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

/** Padrão discreto de linhas de onda, repetido no fundo da página. */
const wavePattern = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="72" viewBox="0 0 240 72">
  <path d="M0 18 C 20 6, 40 6, 60 18 S 100 30, 120 18 S 160 6, 180 18 S 220 30, 240 18" fill="none" stroke="${brand.purple}" stroke-opacity="0.07" stroke-width="2"/>
  <path d="M-60 54 C -40 42, -20 42, 0 54 S 40 66, 60 54 S 100 42, 120 54 S 160 66, 180 54 S 220 42, 240 54 S 280 66, 300 54" fill="none" stroke="${brand.green}" stroke-opacity="0.09" stroke-width="2"/>
</svg>`,
)

/** Ondas grandes fixas no rodapé da tela. */
const waveSwell = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
  <path d="M0 190 C 180 120, 360 120, 540 180 S 900 260, 1080 190 S 1350 120, 1440 150 L1440 320 L0 320 Z" fill="${brand.green}" fill-opacity="0.10"/>
  <path d="M0 240 C 200 190, 380 200, 560 240 S 920 300, 1120 245 S 1360 200, 1440 220 L1440 320 L0 320 Z" fill="${brand.deepGreen}" fill-opacity="0.08"/>
  <path d="M0 280 C 220 250, 420 260, 620 285 S 1000 320, 1200 290 S 1380 265, 1440 275 L1440 320 L0 320 Z" fill="${brand.plum}" fill-opacity="0.06"/>
</svg>`,
)

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
          backgroundImage: `${waveSwell}, ${wavePattern}`,
          backgroundRepeat: 'no-repeat, repeat',
          backgroundPosition: 'bottom center, top left',
          backgroundSize: '100% 38vh, 240px 72px',
          backgroundAttachment: 'fixed, scroll',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', border: `1px solid ${alpha(brand.purple, 0.08)}` },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: brand.purple, color: brand.sand, fontSize: 12, borderRadius: 8 },
      },
    },
  },
})
