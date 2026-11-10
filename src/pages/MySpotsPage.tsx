import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Switch, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Bell, BellOff, ChatLines, EditPencil, SeaWaves } from 'iconoir-react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router'
import { fetchForecast } from '../api/openMeteo'
import { useAuth } from '../auth/context'
import { backend, type Favorite } from '../backend'
import { PrefsDialog } from '../components/community/PrefsDialog'
import { SpotPicker } from '../components/SpotPicker'
import { ALL_SPOTS, type Spot } from '../data/spots'
import { resetDemoAlerts } from '../hooks/useDemoAlerts'
import { useFavorites } from '../hooks/useFavorites'
import { useNotifications } from '../hooks/useNotifications'
import { usePageMeta } from '../lib/meta'
import { disablePush, enablePush, localNotify, pushState, type PushState } from '../lib/push'
import { timeAgo } from '../lib/time'
import { brand } from '../theme'
import { describeMatch, describePrefs, findMatches, type Match } from '../../supabase/functions/_shared/core/prefs.ts'
import { localNow } from '../../supabase/functions/_shared/core/time.ts'

/** Meus picos: favoritos, condições preferidas, próximas sessões que batem e notificações. */
export default function MySpotsPage() {
  const { user, ready } = useAuth()
  const { favorites, save, remove } = useFavorites()
  const { list: notes, markRead } = useNotifications()
  const [params] = useSearchParams()
  const [editing, setEditing] = useState<Spot | null>(null)
  const [push, setPush] = useState<PushState | null>(null)
  const [pushMsg, setPushMsg] = useState<string | null>(null)

  usePageMeta({ title: 'Meus picos · OlhaOnda', description: 'Seus picos favoritos e avisos de previsão.', path: '/meus-picos' })

  useEffect(() => {
    let alive = true
    void pushState().then((s) => alive && setPush(s))
    return () => {
      alive = false
    }
  }, [])

  if (ready && !user) return <Navigate to="/cadastro" replace />

  const editingFav = editing ? (favorites?.find((f) => f.spotId === editing.id) ?? null) : null

  const turnOn = async () => {
    setPushMsg(null)
    try {
      setPush(await enablePush())
    } catch (e) {
      setPushMsg(e instanceof Error ? e.message : 'Não foi possível ligar as notificações.')
    }
  }
  const test = async () => {
    setPushMsg(null)
    try {
      const sent = backend.push.vapidPublicKey ? await backend.push.test() : (await localNotify('OlhaOnda', 'Notificações ligadas neste aparelho!', '/meus-picos', 'teste')) ? 1 : 0
      setPushMsg(sent ? 'Notificação de teste enviada.' : 'Nenhum aparelho inscrito recebeu o teste.')
    } catch (e) {
      setPushMsg(e instanceof Error ? e.message : 'Falha no teste.')
    }
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          Meus picos
        </Typography>
        <Typography sx={{ opacity: 0.7 }}>
          Favorite picos, diga as condições que você curte em cada um e receba um aviso quando a previsão bater.
        </Typography>
      </Box>

      {params.get('bemvindo') && (
        <Alert severity="success" variant="outlined">
          Conta criada! {favorites?.length ? 'Ajuste as condições de cada pico em "Editar condições".' : 'Comece adicionando um pico favorito.'}
        </Alert>
      )}

      {/* notificações neste aparelho */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: alpha(push === 'on' ? brand.green : brand.plum, 0.14), color: push === 'on' ? brand.deepGreen : brand.plum, flexShrink: 0 }}>
            {push === 'on' ? <Bell width={22} height={22} /> : <BellOff width={22} height={22} />}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800 }}>
              {push === 'on' ? 'Notificações ligadas neste aparelho' : push === 'denied' ? 'Notificações bloqueadas no navegador' : push === 'unsupported' ? 'Este navegador não aceita notificações' : 'Notificações desligadas neste aparelho'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {push === 'denied'
                ? 'Libere nas configurações do site no navegador. Os avisos continuam aparecendo no sino.'
                : push === 'unsupported'
                  ? 'Os avisos aparecem no sino do site. No iPhone, adicione o OlhaOnda à tela de início.'
                  : backend.push.vapidPublicKey
                    ? 'Os avisos chegam mesmo com o site fechado.'
                    : 'Demonstração: os avisos aparecem quando o site está aberto.'}
            </Typography>
            {pushMsg && (
              <Typography variant="body2" sx={{ color: brand.plum, fontWeight: 700, mt: 0.5 }}>
                {pushMsg}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {push === 'off' && (
              <Button variant="contained" onClick={() => void turnOn()}>
                Ligar
              </Button>
            )}
            {push === 'on' && (
              <>
                <Button variant="outlined" onClick={() => void test()}>
                  Testar
                </Button>
                {backend.push.vapidPublicKey && (
                  <Button
                    onClick={async () => {
                      await disablePush()
                      setPush(await pushState())
                    }}
                  >
                    Desligar
                  </Button>
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* favoritos */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          Favoritos
        </Typography>
        <SpotPicker value={null} onChange={(s) => s && setEditing(s)} allowEmpty locate={false} placeholder="Adicionar pico" width={320} />
      </Stack>

      {!favorites && <Skeleton variant="rounded" height={140} sx={{ borderRadius: '18px' }} />}
      {favorites?.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>Nenhum pico favorito ainda.</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Use "Adicionar pico" acima ou a estrela na página de previsão.
          </Typography>
        </Paper>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' }, gap: 2 }}>
        {favorites
          ?.slice()
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((f) => {
            const spot = ALL_SPOTS.find((s) => s.id === f.spotId)
            return spot ? (
              <FavoriteCard
                key={f.spotId}
                spot={spot}
                fav={f}
                onEdit={() => setEditing(spot)}
                onToggle={async (on) => {
                  await save(spot.id, f.prefs, on)
                  if (user) resetDemoAlerts(user.id)
                }}
              />
            ) : null
          })}
      </Box>

      {/* avisos */}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          Avisos recentes
        </Typography>
        {notes.some((n) => !n.readAt) && (
          <Button size="small" onClick={() => void markRead('all')}>
            Marcar todos como lidos
          </Button>
        )}
      </Stack>
      <Paper sx={{ overflow: 'hidden' }}>
        {notes.length === 0 && (
          <Typography variant="body2" sx={{ p: 2.5, opacity: 0.7 }}>
            Nenhum aviso ainda. A previsão é conferida todo dia às 5h e às 17h.
          </Typography>
        )}
        {notes.slice(0, 15).map((n, i) => (
          <Box
            key={n.id}
            component={RouterLink}
            to={n.url}
            onClick={() => !n.readAt && void markRead([n.id])}
            sx={{ display: 'block', p: 2, borderTop: i ? 1 : 0, borderColor: 'divider', color: 'inherit', textDecoration: 'none', bgcolor: n.readAt ? 'transparent' : alpha(brand.green, 0.08), '&:hover': { bgcolor: alpha(brand.purple, 0.04) } }}
          >
            <Typography sx={{ fontWeight: 800 }}>{n.title}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {n.body}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.55 }}>
              {timeAgo(n.createdAt)}
            </Typography>
          </Box>
        ))}
      </Paper>

      {editing && (
        <PrefsDialog
          open
          spot={editing}
          initial={editingFav?.prefs ?? null}
          initialNotify={editingFav?.notify ?? true}
          isFavorite={!!editingFav}
          onClose={() => setEditing(null)}
          onSave={async (prefs, notify) => {
            await save(editing.id, prefs, notify)
            if (user) resetDemoAlerts(user.id)
          }}
          onRemove={() => remove(editing.id)}
        />
      )}
    </Stack>
  )
}

function FavoriteCard({ spot, fav, onEdit, onToggle }: { spot: Spot; fav: Favorite; onEdit: () => void; onToggle: (on: boolean) => Promise<void> }) {
  const [matches, setMatches] = useState<{ key: string; list: Match[] } | null>(null)
  const key = `${spot.id}|${JSON.stringify(fav.prefs)}`
  useEffect(() => {
    let alive = true
    fetchForecast(spot.lat, spot.lon)
      .then((f) => alive && setMatches({ key, list: findMatches(spot, f.hours, fav.prefs, localNow().hour, 13) }))
      .catch(() => alive && setMatches({ key, list: [] }))
    return () => {
      alive = false
    }
  }, [spot, fav.prefs, key])
  const list = matches?.key === key ? matches.list : null

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{spot.name}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            {spot.city}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Avisos
          </Typography>
          <Switch size="small" checked={fav.notify} onChange={(e) => void onToggle(e.target.checked)} color="success" slotProps={{ input: { 'aria-label': `Avisos de ${spot.name}` } }} />
        </Stack>
      </Stack>
      <Chip label={describePrefs(fav.prefs)} sx={{ alignSelf: 'flex-start', height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' }, bgcolor: alpha(brand.purple, 0.06) }} />
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {!list ? 'Conferindo a previsão…' : list.length ? 'Próximos dias que batem:' : 'Nenhum dia dos próximos 14 bate por enquanto.'}
        </Typography>
        {list?.slice(0, 3).map((m) => (
          <Typography key={m.start} variant="body2" component={RouterLink} to={`/pico/${spot.id}?t=${encodeURIComponent(m.start)}`} sx={{ display: 'block', color: brand.deepGreen, fontWeight: 600 }}>
            {describeMatch(m)}
          </Typography>
        ))}
      </Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
        <Button size="small" startIcon={<EditPencil width={16} height={16} />} onClick={onEdit}>
          Editar condições
        </Button>
        <Button size="small" component={RouterLink} to={`/pico/${spot.id}`} startIcon={<SeaWaves width={16} height={16} />}>
          Previsão
        </Button>
        <Button size="small" component={RouterLink} to={`/pico/${spot.id}/forum`} startIcon={<ChatLines width={16} height={16} />}>
          Fórum do pico
        </Button>
      </Stack>
    </Paper>
  )
}
