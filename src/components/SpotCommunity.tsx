import { Box, Button, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Camera, ChatLines } from 'iconoir-react'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { backend, PERIOD_LABEL, type PhotoSession, type Thread } from '../backend'
import { FEATURES } from '../config/env'
import type { Spot } from '../data/spots'
import { timeAgo } from '../lib/time'
import { dayLabel } from '../lib/surf'
import { brand } from '../theme'
import { useDailyPost } from '../hooks/useDailyPost'
import { LogoMark } from './Logo'

/** Tópicos e fotos recentes do pico selecionado. */
export function SpotCommunity({ spot }: { spot: Spot }) {
  const [data, setData] = useState<{ spot: string; threads: Thread[]; sessions: PhotoSession[] } | null>(null)
  const version = useDailyPost(FEATURES.forum ? spot : null)

  useEffect(() => {
    let alive = true
    Promise.all([
      FEATURES.forum ? backend.forum.listThreads({ spotId: spot.id }) : Promise.resolve([]),
      FEATURES.photos ? backend.photos.listSessions({ spotId: spot.id }) : Promise.resolve([]),
    ])
      .then(([threads, sessions]) => alive && setData({ spot: spot.id, threads, sessions: sessions.slice(0, 4) }))
      .catch(() => alive && setData({ spot: spot.id, threads: [], sessions: [] }))
    return () => {
      alive = false
    }
  }, [spot.id, version])

  const current = data?.spot === spot.id ? data : null
  const daily = current?.threads.filter((t) => t.kind === 'daily').sort((a, b) => (b.forecastDate ?? '').localeCompare(a.forecastDate ?? ''))[0] ?? null
  const userThreads = current?.threads.filter((t) => t.kind === 'user').slice(0, 3) ?? []

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: FEATURES.forum && FEATURES.photos ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' },
        gap: 2,
      }}
    >
      {FEATURES.forum && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6">Fórum do pico</Typography>
            <Button component={RouterLink} to={`/pico/${spot.id}/forum`} size="small" startIcon={<ChatLines width={16} height={16} />}>
              Abrir fórum
            </Button>
          </Stack>
          {daily && (
            <ButtonBase
              component={RouterLink}
              to={`/forum/${daily.id}`}
              sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', textAlign: 'left', p: 1.5, mb: 1, width: '100%', borderRadius: '14px', bgcolor: alpha(brand.green, 0.1), '&:hover': { bgcolor: alpha(brand.green, 0.16) } }}
            >
              <Box sx={{ flexShrink: 0, mt: 0.25 }}>
                <LogoMark size={22} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.7 }}>
                  OlhaOnda · resumo do dia
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{daily.title}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.65 }}>
                  {daily.replyCount} {daily.replyCount === 1 ? 'resposta' : 'respostas'} · conte como está o mar
                </Typography>
              </Box>
            </ButtonBase>
          )}
          {current && userThreads.length === 0 && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Nenhum tópico da galera sobre {spot.name} ainda.{' '}
              <RouterLink to={`/pico/${spot.id}/forum?novo=1`} style={{ color: brand.plum, fontWeight: 700 }}>
                Conte como está o mar
              </RouterLink>
              .
            </Typography>
          )}
          <Stack spacing={0.5}>
            {userThreads.map((t) => (
              <ButtonBase
                key={t.id}
                component={RouterLink}
                to={`/forum/${t.id}`}
                sx={{ display: 'block', textAlign: 'left', p: 1.25, mx: -1.25, borderRadius: '12px', '&:hover': { bgcolor: alpha(brand.purple, 0.05) } }}
              >
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {t.title}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.65 }}>
                  {t.authorName} · {timeAgo(t.lastActivityAt)} · {t.replyCount} respostas
                </Typography>
              </ButtonBase>
            ))}
          </Stack>
        </Paper>
      )}

      {FEATURES.photos && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6">Fotos da sessão</Typography>
            <Button component={RouterLink} to={`/fotos?pico=${spot.id}`} size="small" startIcon={<Camera width={16} height={16} />}>
              Ver todas
            </Button>
          </Stack>
          {current && current.sessions.length === 0 && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Nenhum fotógrafo publicou fotos de {spot.name} ainda.
            </Typography>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1 }}>
            {current?.sessions.map((s) => {
              const { wd, dm } = dayLabel(s.date)
              return (
                <ButtonBase
                  key={s.id}
                  component={RouterLink}
                  to={`/fotos/sessao/${s.id}`}
                  sx={{ display: 'block', borderRadius: '12px', overflow: 'hidden', position: 'relative', aspectRatio: '3 / 2' }}
                >
                  {s.coverUrl && <Box component="img" src={s.coverUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  <Box sx={{ position: 'absolute', inset: 'auto 0 0 0', p: 1, background: 'linear-gradient(transparent, rgba(15,76,58,.85))', color: brand.sand, textAlign: 'left' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                      {wd} {dm} · {PERIOD_LABEL[s.period]}
                    </Typography>
                    <Typography sx={{ fontSize: 11, opacity: 0.85 }}>{s.photographerName}</Typography>
                  </Box>
                </ButtonBase>
              )
            })}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
