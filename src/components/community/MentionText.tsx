import { Box, Typography, type TypographyProps } from '@mui/material'
import { useAuth } from '../../auth/context'
import { splitMentions } from '../../lib/mentions'
import { alpha, brand } from '../../theme'

/** Texto do fórum com as marcações (@apelido) em destaque; a que marca você fica mais forte. */
export function MentionText({ text, ...rest }: { text: string } & Omit<TypographyProps, 'children'>) {
  const { user } = useAuth()
  const me = user?.username?.toLowerCase()
  return (
    <Typography {...rest}>
      {splitMentions(text).map((p, i) =>
        p.mention ? (
          <Box
            key={i}
            component="span"
            sx={{
              color: brand.plum,
              fontWeight: 800,
              bgcolor: alpha(brand.green, p.mention === me ? 0.32 : 0.16),
              borderRadius: '6px',
              px: 0.5,
              mx: '-1px',
            }}
          >
            {p.text}
          </Box>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </Typography>
  )
}
