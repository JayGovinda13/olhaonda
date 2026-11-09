import { Box, type SxProps, type Theme } from '@mui/material'
import { useId } from 'react'
import { brand } from '../theme'

/**
 * Identidade visual OlhaOnda.
 *
 * Os dois "O" de Olha e Onda são desenhados como as lentes de um binóculo:
 * anel grosso, ocular no topo e uma onda verde "vista" dentro de cada lente.
 * Quando aparecem juntos (LogoMark) são unidos por uma ponte com dobradiça,
 * formando o binóculo completo.
 */

type LensProps = {
  size?: number
  ring?: string
  wave?: string
  eyepiece?: string
}

/** Um "O" em forma de lente de binóculo (usado dentro do wordmark). */
export function Lens({
  size = 40,
  ring = brand.purple,
  wave = brand.green,
  eyepiece = brand.plum,
}: LensProps) {
  const clip = useId()
  return (
    <svg
      width={size}
      height={size * 1.12}
      viewBox="0 0 100 112"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="62" r="32" />
        </clipPath>
      </defs>
      {/* ocular */}
      <rect x="30" y="0" width="40" height="20" rx="6" fill={eyepiece} />
      {/* onda vista pela lente */}
      <g clipPath={`url(#${clip})`}>
        <path
          d="M10 72 C 24 60, 36 60, 50 70 S 76 82, 92 68 L 92 100 L 10 100 Z"
          fill={wave}
        />
        <path
          d="M10 84 C 26 76, 38 78, 52 84 S 78 92, 92 82 L 92 100 L 10 100 Z"
          fill={brand.deepGreen}
          opacity="0.55"
        />
      </g>
      {/* anel */}
      <circle cx="50" cy="62" r="38" fill="none" stroke={ring} strokeWidth="13" />
      {/* reflexo */}
      <path
        d="M30 48 A 24 24 0 0 1 44 36"
        fill="none"
        stroke={brand.sand}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** O binóculo completo (os dois "O" unidos). Bom para favicon e avatar. */
export function LogoMark({ size = 48, sx }: { size?: number; sx?: SxProps<Theme> }) {
  const a = useId()
  const b = useId()
  const lens = (cx: number, id: string) => (
    <g key={id}>
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy="72" r="31" />
        </clipPath>
      </defs>
      <rect x={cx - 20} y="8" width="40" height="22" rx="7" fill={brand.plum} />
      <g clipPath={`url(#${id})`}>
        <path
          d={`M${cx - 40} 82 C ${cx - 26} 70, ${cx - 14} 70, ${cx} 80 S ${cx + 26} 92, ${cx + 40} 78 L ${cx + 40} 110 L ${cx - 40} 110 Z`}
          fill={brand.green}
        />
        <path
          d={`M${cx - 40} 94 C ${cx - 24} 86, ${cx - 12} 88, ${cx + 2} 94 S ${cx + 28} 102, ${cx + 40} 92 L ${cx + 40} 110 L ${cx - 40} 110 Z`}
          fill={brand.deepGreen}
          opacity="0.55"
        />
      </g>
      <circle cx={cx} cy="72" r="38" fill="none" stroke={brand.purple} strokeWidth="13" />
      <path
        d={`M${cx - 20} 58 A 24 24 0 0 1 ${cx - 6} 46`}
        fill="none"
        stroke={brand.sand}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  )
  return (
    <Box
      component="svg"
      viewBox="0 0 220 120"
      role="img"
      aria-label="OlhaOnda"
      sx={{ width: size * (220 / 120), height: size, display: 'block', ...sx }}
    >
      {/* ponte + dobradiça */}
      <rect x="92" y="44" width="36" height="20" rx="6" fill={brand.purple} />
      <circle cx="110" cy="54" r="9" fill={brand.plum} />
      {lens(56, a)}
      {lens(164, b)}
    </Box>
  )
}

/** Wordmark "OlhaOnda" com os dois O em forma de lente. */
export function Wordmark({
  height = 32,
  color = brand.purple,
}: {
  height?: number
  color?: string
}) {
  const letters = (text: string) => (
    <Box
      component="span"
      sx={{
        fontWeight: 800,
        fontSize: height,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        color,
        // alinha a base das letras com a base da lente
        transform: `translateY(${height * 0.04}px)`,
      }}
    >
      {text}
    </Box>
  )
  const lensSize = height * 0.82
  return (
    <Box
      aria-label="OlhaOnda"
      role="img"
      sx={{ display: 'inline-flex', alignItems: 'flex-end', gap: `${height * 0.03}px` }}
    >
      <Lens size={lensSize} ring={color} />
      {letters('lha')}
      <Box sx={{ width: height * 0.12 }} />
      <Lens size={lensSize} ring={color} />
      {letters('nda')}
    </Box>
  )
}
