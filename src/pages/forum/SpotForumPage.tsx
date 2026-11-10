import { Alert, Box, Button, ButtonBase, Collapse, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { ArrowRight, ChatBubble, NavArrowDown, Plus, SeaWaves } from 'iconoir-react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/context'
import { backend, type Thread } from '../../backend'
import { FavoriteButton } from '../../components/community/FavoriteButton'
import { LogoMark } from '../../components/Logo'
import { ALL_SPOTS, SPOT_ALIASES } from '../../data/spots'
import { useDailyPost } from '../../hooks/useDailyPost'
import { usePageMeta } from '../../lib/meta'
import { dayLabel } from '../../lib/surf'
import { timeAgo } from '../../lib/time'
import { alpha, brand } from '../../theme'
import { localNow } from '../../../supabase/functions/_shared/core/time.ts'
import { NewThreadDialog } from './ForumPage'

/** Fórum de um pico: resumo diário do OlhaOnda no topo e os tópicos da galera. */
export default function SpotForumPage() {
  const { id = '' } = useParams()
  const spot = ALL_SPOTS.find((s) => s.id === id) ?? null
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { requireLogin } = useAuth()
  const version = useDailyPost(spot)
  const [result, setResult] = useState<{ key: string; threads: Thread[] } | null>(null)
  const [showOld, setShowOld] = useState(false)
  const key = `${id}|${version}`

  usePageMeta({
    title: spot ? `Fórum ${spot.name} (${spot.city}) · OlhaOnda` : 'Fórum · OlhaOnda',
    description: spot ? `Previsão do dia e conversa sobre ${spot.name}, ${spot.city}: como está o mar, o pico e as condições.` : 'Fórum do OlhaOnda',
    path: `/pico/${id}/forum`,
  })

  useEffect(() => {
    if (!spot) return
    let alive = true
    backend.forum
      .listThreads({ spotId: spot.id })
      .then((threads) => alive && setResult({ key, threads }))
      .catch(() => alive && setResult({ key, threads: [] }))
    return () => {
      alive = false
    }
  }, [spot, key])

  if (!spot) return <Navigate to={SPOT_ALIASES[id] ? `/pico/${SPOT_ALIASES[id]}/forum` : '/forum'} replace />

  const threads = result?.key === key ? result.threads : result?.threads ?? null
  const today = localNow().date
  const daily = (threads ?? []).filter((t) => t.kind === 'daily').sort((a, b) => (b.forecastDate ?? '').localeCompare(a.forecastDate ?? ''))
  const todays = daily.find((t) => t.forecastDate === today) ?? null
  const older = daily.filter((t) => t !== todays)
  const userThreads = (threads ?? []).filter((t) => t.kind === 'user')
  const composing = params.get('novo') === '1'

  const openComposer = async () => {
    if (await requireLogin('Entre para criar um tópico no fórum do pico.')) setParams({ novo: '1' }, { replace: true })
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}>
        <Box>
          <Typography variant="overline" sx={{ opacity: 0.7 }}>
            Fórum do pico · {spot.city}
          </Typography>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
            {spot.name}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button component={RouterLink} to={`/pico/${spot.id}`} variant="outlined" startIcon={<SeaWaves width={18} height={18} />} sx={{ borderRadius: 99, bgcolor: 'background.paper' }}>
            Previsão
          </Button>
          <FavoriteButton spot={spot} />
          <Button variant="contained" startIcon={<Plus width={18} height={18} />} onClick={() => void openComposer()} sx={{ borderRadius: 99 }}>
            Novo tópico
          </Button>
        </Stack>
      </Stack>

      {/* resumo do dia */}
      {!threads ? (
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: '18px' }} />
      ) : todays ? (
        <DailyCard t={todays} highlight />
      ) : (
        <Alert severity="info" variant="outlined">
          O resumo da previsão de hoje é publicado todo dia às 5h.
        </Alert>
      )}

      {older.length > 0 && (
        <Box>
          <Button size="small" onClick={() => setShowOld((v) => !v)} endIcon={<NavArrowDown width={16} height={16} style={{ transform: showOld ? 'rotate(180deg)' : 'none' }} />}>
            Resumos anteriores ({older.length})
          </Button>
          <Collapse in={showOld}>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {older.slice(0, 14).map((t) => (
                <ThreadRow key={t.id} t={t} />
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}

      <Typography variant="h6" component="h2">
        Conversa
      </Typography>
      <Paper sx={{ overflow: 'hidden' }}>
        {threads && userThreads.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700 }}>Ninguém abriu um tópico sobre {spot.name} ainda.</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Conte como está o mar, o crowd, o estacionamento…
            </Typography>
          </Box>
        )}
        {userThreads.map((t, i) => (
          <Box key={t.id} sx={{ borderTop: i ? 1 : 0, borderColor: 'divider' }}>
            <ThreadRow t={t} flat />
          </Box>
        ))}
      </Paper>

      <NewThreadDialog
        open={composing}
        defaultSpot={spot.id}
        defaultCategory="condicoes"
        onClose={() => setParams({}, { replace: true })}
        onCreated={(t) => navigate(`/forum/${t.id}`)}
      />
    </Stack>
  )
}

function DailyCard({ t, highlight }: { t: Thread; highlight?: boolean }) {
  const { wd, dm } = dayLabel(t.forecastDate ?? t.createdAt.slice(0, 10))
  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 }, border: highlight ? `1.5px solid ${alpha(brand.green, 0.6)}` : undefined }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: brand.sand, border: `1px solid ${alpha(brand.purple, 0.15)}` }}>
          <LogoMark size={24} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800 }}>OlhaOnda · previsão de {wd} {dm}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {timeAgo(t.createdAt)} · {t.replyCount} {t.replyCount === 1 ? 'resposta' : 'respostas'}
          </Typography>
        </Box>
      </Stack>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {t.title}
      </Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap', opacity: 0.9, fontSize: 15 }}>{t.body}</Typography>
      <Button component={RouterLink} to={`/forum/${t.id}`} variant="contained" endIcon={<ArrowRight width={16} height={16} />} sx={{ mt: 2 }}>
        Comentar como está o mar
      </Button>
    </Paper>
  )
}

function ThreadRow({ t, flat }: { t: Thread; flat?: boolean }) {
  return (
    <ButtonBase
      component={RouterLink}
      to={`/forum/${t.id}`}
      sx={{
        display: 'flex',
        width: '100%',
        textAlign: 'left',
        gap: 2,
        p: { xs: 2, sm: 2.5 },
        alignItems: 'center',
        borderRadius: flat ? 0 : '14px',
        bgcolor: flat ? 'transparent' : 'background.paper',
        '&:hover': { bgcolor: alpha(brand.purple, 0.04) },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800 }}>{t.title}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.65 }}>
          {t.authorName} · {timeAgo(t.lastActivityAt)}
        </Typography>
      </Box>
      <Stack sx={{ alignItems: 'center', minWidth: 40, color: brand.plum }}>
        <ChatBubble width={18} height={18} />
        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{t.replyCount}</Typography>
      </Stack>
    </ButtonBase>
  )
}
