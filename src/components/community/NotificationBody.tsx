import { Box, Stack, Typography } from '@mui/material'
import type { AppNotification } from '../../backend'
import { parseBody, type Window } from '../../lib/alertBody'
import { alpha, brand } from '../../theme'

function WindowRow({ w }: { w: Window }) {
  const details = [
    w.swell ? `Ondulação ${w.swell}${w.kj ? ` · ${w.kj}` : ''}` : w.kj,
    w.wind ? `Vento ${w.wind}` : null,
  ].filter(Boolean)
  return (
    <Box sx={{ pl: 1.25, borderLeft: `3px solid ${alpha(brand.green, 0.55)}` }}>
      <Typography component="div" sx={{ fontSize: 13.5, lineHeight: 1.35 }}>
        <b>{w.day}</b> · {w.hours} · <b>{w.size}</b>
      </Typography>
      {details.map((d) => (
        <Typography key={d} component="div" variant="caption" sx={{ display: 'block', opacity: 0.7, lineHeight: 1.35 }}>
          {d}
        </Typography>
      ))}
    </Box>
  )
}

/** Texto do aviso em blocos: uma janela por linha, motivos em lista. */
export function NotificationBody({ n }: { n: Pick<AppNotification, 'kind' | 'body'> }) {
  const p = parseBody(n)

  if (p.type === 'text')
    return (
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        {p.text}
      </Typography>
    )

  if (p.type === 'lost')
    return (
      <Stack spacing={0.75} sx={{ mt: 0.25 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.75 }}>
          Por que saiu:
        </Typography>
        {p.reasons.map((r, i) => (
          <Box key={i} sx={{ pl: 1.25, borderLeft: `3px solid ${alpha('#B3541E', 0.6)}` }}>
            {r.when && (
              <Typography component="div" sx={{ fontSize: 13.5, fontWeight: 800 }}>
                {r.when}
              </Typography>
            )}
            {r.why.map((w) => (
              <Typography key={w} component="div" variant="caption" sx={{ display: 'block', opacity: 0.8, lineHeight: 1.35 }}>
                {w}
              </Typography>
            ))}
          </Box>
        ))}
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Avisamos de novo se voltar a bater.
        </Typography>
      </Stack>
    )

  if (p.type === 'change')
    return (
      <Stack spacing={0.75} sx={{ mt: 0.25 }}>
        {p.notes.map((t) => (
          <Typography key={t} variant="body2" sx={{ opacity: 0.85 }}>
            {t}
          </Typography>
        ))}
        <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.75 }}>
          Agora:
        </Typography>
        {p.windows.map((w) => (
          <WindowRow key={w.day + w.hours} w={w} />
        ))}
      </Stack>
    )

  return (
    <Stack spacing={0.75} sx={{ mt: 0.25 }}>
      {p.lead && (
        <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.75 }}>
          {p.lead}
        </Typography>
      )}
      {p.windows.map((w) => (
        <WindowRow key={w.day + w.hours} w={w} />
      ))}
      {p.more && (
        <Typography variant="caption" sx={{ opacity: 0.65 }}>
          {p.more}
        </Typography>
      )}
    </Stack>
  )
}
