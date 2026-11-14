// Confere AGORA o aviso de um pico favorito da própria pessoa (chamado quando ela salva as condições).
//   { spotId }  → avalia a previsão com as condições salvas e gera o aviso (entrou/mudou/saiu/voltou) na hora
// Só vale para quem tem acesso liberado e só mexe nos favoritos de quem chamou.
import { admin, handle, HttpError, json, requireUser } from '../_shared/util.ts'
import { applyAlert } from '../_shared/alerts-run.ts'
import { EMPTY_ALERT, type AlertState } from '../_shared/core/alerts.ts'
import { fetchForecastRaw } from '../_shared/core/openMeteo.ts'
import { normalizePrefs } from '../_shared/core/prefs.ts'
import { ALL_SPOTS } from '../_shared/core/spots.ts'
import { localNow } from '../_shared/core/time.ts'

const SITE = (Deno.env.get('SITE_URL') ?? 'https://olhaonda.com').replace(/\/$/, '')
const COOLDOWN_MS = 15_000

Deno.serve(
  handle(async (req) => {
    const user = await requireUser(req)
    const body = await req.json().catch(() => ({}))
    const spot = ALL_SPOTS.find((s) => s.id === String(body.spotId ?? ''))
    if (!spot) throw new HttpError(400, 'Pico não encontrado.')
    const sb = admin()

    // teste fechado: só quem foi liberado (ou todos, se o app estiver aberto)
    const { data: cfg } = await sb.from('app_settings').select('invite_only').maybeSingle()
    const { data: prof } = await sb.from('profiles').select('approved_at, role').eq('id', user.id).maybeSingle()
    const member = cfg?.invite_only === false || Boolean(prof?.approved_at) || prof?.role === 'admin' || prof?.role === 'moderator'
    if (!member) throw new HttpError(403, 'Seu acesso ainda não foi liberado.')

    const { data: fav } = await sb.from('favorite_spots').select('prefs, notify').eq('user_id', user.id).eq('spot_id', spot.id).maybeSingle()
    if (!fav || !fav.notify) return json({ checked: false })

    // evita chamadas em sequência (cada uma consulta a previsão)
    const { data: row } = await sb.from('alert_state').select('state, updated_at').eq('user_id', user.id).eq('spot_id', spot.id).maybeSingle()
    if (row && Date.now() - new Date(row.updated_at).getTime() < COOLDOWN_MS) return json({ checked: false, wait: true })

    const f = await fetchForecastRaw(spot.lat, spot.lon, { apiKey: Deno.env.get('OPEN_METEO_API_KEY') || undefined }).catch(() => null)
    if (!f) throw new HttpError(502, 'Não foi possível consultar a previsão agora. O aviso sai na próxima conferência.')

    const { data: wa } = await sb.from('whatsapp_contacts').select('phone').eq('user_id', user.id).eq('enabled', true).is('opted_out_at', null).maybeSingle()
    const r = await applyAlert(sb, {
      userId: user.id,
      spot,
      prefs: normalizePrefs(fav.prefs as Record<string, unknown>),
      hours: f.hours,
      state: { ...EMPTY_ALERT, ...((row?.state as Partial<AlertState> | undefined) ?? {}) },
      phone: wa?.phone,
      site: SITE,
      now: localNow(),
    })
    if (r.error) console.error('alerts-now', r.error)
    return json({ checked: true, notified: r.notified, status: r.state.status })
  }),
)
