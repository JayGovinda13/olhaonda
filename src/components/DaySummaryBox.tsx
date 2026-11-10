import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { brand } from '../theme'

/** Resumo curto do dia no rodapé dos cards (ocupa o espaço que sobra no fim do card). */
export function DaySummaryBox({ title, lines }: { title: string; lines: string[] }) {
  if (!lines.length) return null
  return (
    <Box sx={{ mt: 'auto', pt: 2.5 }}>
      <Box sx={{ p: 1.75, borderRadius: '14px', bgcolor: alpha(brand.green, 0.09), border: `1px solid ${alpha(brand.green, 0.18)}` }}>
        <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', opacity: 0.7, mb: 0.5 }}>
          {title}
        </Typography>
        {lines.map((l) => (
          <Typography key={l} variant="body2" sx={{ lineHeight: 1.5 }}>
            {l}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}
