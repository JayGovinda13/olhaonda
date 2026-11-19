import { Box, Stack, Typography } from '@mui/material'
import type { AppNotification } from '../../backend'
import { parseBody, windowHref, type ChangeRow, type Window } from '../../lib/alertBody'
import { alpha, brand } from '../../theme'

/** Linha clicável: abre o pico naquele dia e hora (sem passar pelo clique do aviso inteiro). */
function Go({ href, onOpen, label, children }: { href: string | null; onOpen?: (to: string) => void; label: string; children: React.ReactNode }) {
  if (!href || !onOpen) return <>{children}</>
  const open = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpen(href)
  }
  return (
    <Box
      role="link"
      tabIndex={0}
      aria-label={label}
      title="Ver a previsão neste horário"
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && open(e)}
      sx={{ cursor: 'pointer', borderRadius: '8px', mx: -0.5, px: 0.5, '&:hover, &:focus-visible': { bgcolor: alpha(brand.green, 0.14), outline: 'none' } }}
    >
      {children}
    </Box>
  )
}

function WindowRow({ w, href, onOpen }: { w: Window; href: string | null; onOpen?: (to: string) => void }) {
  const details = [
    w.swell ? `Ondulação ${w.swell}${w.kj ? ` · ${w.kj}` : ''}` : w.kj,
    w.swell2 ? `2ª ondulação ${w.swell2}` : null,
    w.wind ? `Vento ${w.wind}` : null,
  ].filter(Boolean)
  return (
    <Box sx={{ pl: 1.25, borderLeft: `3px solid ${alpha(brand.green, 0.55)}` }}>
      <Go href={href} onOpen={onOpen} label={`Ver a previsão de ${w.day}, ${w.hours}`}>
        <Typography component="div" sx={{ fontSize: 13.5, lineHeight: 1.35 }}>
          <b>{w.day}</b> · {w.hours} · <b>{w.size}</b>
        </Typography>
        {details.map((d) => (
          <Typography key={d} component="div" variant="caption" sx={{ display: 'block', opacity: 0.7, lineHeight: 1.35 }}>
            {d}
          </Typography>
        ))}
      </Go>
    </Box>
  )
}

const TAG_COLOR: Record<ChangeRow['tag'], string> = { Entrou: brand.green, Mudou: brand.plum, Saiu: '#B3541E' }

/** "Mudou  ter 17/11  era 05h–11h · 1,5 m → agora 08h–13h · 1,5 m" */
function ChangeLine({ r, href, onOpen }: { r: ChangeRow; href: string | null; onOpen?: (to: string) => void }) {
  return (
    <Box sx={{ pl: 1.25, borderLeft: `3px solid ${alpha(TAG_COLOR[r.tag], 0.65)}` }}>
      <Go href={href} onOpen={onOpen} label={`Ver a previsão de ${r.day}`}>
        <Typography component="div" sx={{ fontSize: 13.5, lineHeight: 1.4 }}>
          <Box component="span" sx={{ fontWeight: 800, color: TAG_COLOR[r.tag], mr: 0.75, textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>
            {r.tag}
          </Box>
          <b>{r.day}</b>
          {r.tag === 'Entrou' && (
            <>
              {' · '}
              {r.hours} · <b>{r.size}</b>
            </>
          )}
        </Typography>
        {r.tag === 'Mudou' && (
          <Typography component="div" variant="caption" sx={{ display: 'block', opacity: 0.8, lineHeight: 1.35 }}>
            era {r.before} → <b>agora {r.after}</b>
          </Typography>
        )}
        {r.tag === 'Saiu' &&
          r.why?.map((w) => (
            <Typography key={w} component="div" variant="caption" sx={{ display: 'block', opacity: 0.8, lineHeight: 1.35 }}>
              {w}
            </Typography>
          ))}
      </Go>
    </Box>
  )
}

/** Texto do aviso em blocos: uma janela por linha, motivos em lista. */
export function NotificationBody({ n, onOpen }: { n: Pick<AppNotification, 'kind' | 'body' | 'spotId' | 'createdAt'>; onOpen?: (to: string) => void }) {
  const p = parseBody(n)
  const hrefOf = (day: string, hours?: string) => windowHref(n.spotId, day, hours, n.createdAt)

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
              <Go href={hrefOf(r.when, r.when)} onOpen={onOpen} label={`Ver a previsão de ${r.when}`}>
                <Typography component="div" sx={{ fontSize: 13.5, fontWeight: 800 }}>
                  {r.when}
                </Typography>
              </Go>
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
    return p.rows.length ? (
      <Stack spacing={0.9} sx={{ mt: 0.25 }}>
        {p.rows.map((r, i) => (
          <ChangeLine key={i} r={r} href={hrefOf(r.day, r.hours)} onOpen={onOpen} />
        ))}
      </Stack>
    ) : (
      <Stack spacing={0.75} sx={{ mt: 0.25 }}>
        {p.notes.map((t) => (
          <Typography key={t} variant="body2" sx={{ opacity: 0.85 }}>
            {t}
          </Typography>
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
        <WindowRow key={w.day + w.hours} w={w} href={hrefOf(w.day, w.hours)} onOpen={onOpen} />
      ))}
      {p.more && (
        <Typography variant="caption" sx={{ opacity: 0.65 }}>
          {p.more}
        </Typography>
      )}
    </Stack>
  )
}
