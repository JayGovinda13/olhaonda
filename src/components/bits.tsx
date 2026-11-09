import { Box, Tooltip } from '@mui/material'
import { ArrowUp } from 'iconoir-react'
import { dirDeg, ratingColor } from '../lib/surf'

/** Seta apontando para onde a ondulação/vento VAI (dados vêm como "de onde"). */
export function DirArrow({
  deg,
  size = 18,
  color = 'currentColor',
  label,
}: {
  deg: number | null | undefined
  size?: number
  color?: string
  label?: string
}) {
  if (deg == null) return null
  return (
    <Tooltip title={`${label ?? 'De'} ${dirDeg(deg)}`}>
      <Box
        component="span"
        sx={{ display: 'inline-flex', transform: `rotate(${deg + 180}deg)`, transition: 'transform .3s' }}
      >
        <ArrowUp width={size} height={size} color={color} strokeWidth={2.2} />
      </Box>
    </Tooltip>
  )
}

/** Cinco segmentos indicando a nota da sessão. */
export function RatingDots({ score, light = false }: { score: number; light?: boolean }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }} aria-label={`Nota ${score.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, score - i))
        return (
          <Box
            key={i}
            sx={{
              width: 22,
              height: 6,
              borderRadius: 3,
              bgcolor: light ? 'rgba(245,230,211,.22)' : 'rgba(75,29,90,.12)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ width: `${fill * 100}%`, height: '100%', bgcolor: light ? '#2FAE7B' : ratingColor(score) }} />
          </Box>
        )
      })}
    </Box>
  )
}
