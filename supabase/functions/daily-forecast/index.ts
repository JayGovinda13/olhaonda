// Rodada diária (chamada pelo agendador com o cabeçalho x-cron-secret):
//  1. publica no fórum dos picos FAVORITADOS por alguém o resumo da previsão do dia, assinado pelo OlhaOnda
//  2. confere os picos favoritos de cada usuário contra a previsão (próximos 7 dias) e avisa no site, por push e
//     por WhatsApp quando uma janela ENTRA, MUDA, SAI (com o motivo) ou VOLTA a bater com as condições preferidas.
//     O ciclo de cada pico fica em alert_state (regras em _shared/core/alerts.ts).
// Os cálculos são os mesmos do site (supabase/functions/_shared/core).
import { admin, env, json } from '../_shared/util.ts'
import { fetchForecastRaw, type Forecast } from '../_shared/core/openMeteo.ts'
import { EMPTY_ALERT, type AlertState } from '../_shared/core/alerts.ts'
import { applyAlert } from '../_shared/alerts-run.ts'
import { normalizePrefs } from '../_shared/core/prefs.ts'
import { ALL_SPOTS, type Spot } from '../_shared/core/spots.ts'
import { dailySummary } from '../_shared/core/summary.ts'
import { localNow } from '../_shared/core/time.ts'

const SITE = (Deno.env.get('SITE_URL') ?? 'https://staging.olhaonda.com').replace(/\/$/, '')

/** roda `fn` em todos os itens com no máximo `n` ao mesmo tempo */
async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) await fn(items[i++])
  }))
}

Deno.serve(async (req) => {
  const given = req.headers.get('x-cron-secret') ?? ''
  const sb = admin()
  // aceita o segredo da função (GitHub) ou o guardado no Vault do Supabase (pg_cron)
  let authorized = !!given && given === (Deno.env.get('CRON_SECRET') ?? '')
  if (!authorized && given) {
    const { data } = await sb.rpc('cron_secret_matches', { candidate: given })
    authorized = data === true
  }
  if (!authorized) return json({ error: 'forbidden' }, 403)
  const url = new URL(req.url)
  const onlyAlerts = url.searchParams.get('only') === 'alerts'
  const apiKey = Deno.env.get('OPEN_METEO_API_KEY') || undefined
  const now = localNow()

  const { data: favs, error } = await sb.from('favorite_spots').select('user_id, spot_id, prefs').eq('notify', true)
  if (error) return json({ error: error.message }, 500)
  // estado do ciclo de cada pico e WhatsApp verificado e ligado de cada pessoa
  const { data: stateRows } = await sb.from('alert_state').select('user_id, spot_id, state')
  const stateOf = new Map<string, AlertState>((stateRows ?? []).map((r) => [`${r.user_id}:${r.spot_id}`, { ...EMPTY_ALERT, ...(r.state as Partial<AlertState>) }]))
  const { data: contacts } = await sb.from('whatsapp_contacts').select('user_id, phone').eq('enabled', true).is('opted_out_at', null)
  const phoneOf = new Map<string, string>((contacts ?? []).map((c) => [c.user_id, c.phone]))
  // teste fechado: só avisa quem tem acesso liberado (ou todos, se o app estiver aberto)
  const { data: cfg } = await sb.from('app_settings').select('invite_only').maybeSingle()
  const { data: allowed } = await sb.from('profiles').select('id').or('approved_at.not.is.null,role.in.(moderator,admin)')
  const allowedIds = new Set((allowed ?? []).map((p) => p.id as string))
  const favBySpot = new Map<string, { user_id: string; prefs: unknown }[]>()
  for (const f of favs ?? []) {
    if (cfg?.invite_only !== false && !allowedIds.has(f.user_id)) continue
    if (!favBySpot.has(f.spot_id)) favBySpot.set(f.spot_id, [])
    favBySpot.get(f.spot_id)!.push(f)
  }

  // O resumo do dia no fórum só sai nos picos que alguém (com acesso liberado) favoritou, com o aviso ligado ou não.
  // Os outros picos ficam sem mensagem: o fórum deles não enche de resumos que ninguém pediu.
  const { data: allFavs } = await sb.from('favorite_spots').select('user_id, spot_id')
  const favoritedSpots = new Set((allFavs ?? []).filter((f) => cfg?.invite_only === false || allowedIds.has(f.user_id)).map((f) => f.spot_id as string))

  // picos a consultar: nas conferências só de avisos, os que têm aviso ligado; na rodada completa, todos os favoritados
  const spotIds = new Set<string>(onlyAlerts ? favBySpot.keys() : [...favoritedSpots, ...favBySpot.keys()])
  const spots: Spot[] = [...spotIds].map((id) => ALL_SPOTS.find((x) => x.id === id)).filter((s): s is Spot => Boolean(s))

  // retenção (LGPD): registros técnicos de mensagens e códigos não ficam guardados para sempre
  const day = 86_400_000
  await sb.from('whatsapp_messages').delete().lt('created_at', new Date(Date.now() - 90 * day).toISOString())
  await sb.from('whatsapp_codes').delete().lt('expires_at', new Date(Date.now() - day).toISOString())
  await sb.from('notifications').delete().lt('created_at', new Date(Date.now() - 180 * day).toISOString())

  const out = { date: now.date, spots: spots.length, posted: 0, notified: 0, pushed: 0, whatsapp: 0, errors: [] as string[] }

  await pool(spots, 4, async (spot) => {
    let f: Forecast
    try {
      f = await fetchForecastRaw(spot.lat, spot.lon, { apiKey })
    } catch (e) {
      out.errors.push(`${spot.id}: ${(e as Error).message}`)
      return
    }

    // 1. resumo do dia no fórum do pico (um por dia: o índice único barra repetidos)
    if (!onlyAlerts && favoritedSpots.has(spot.id)) {
      const s = dailySummary(spot, f, now.date)
      if (s) {
        const { error: e } = await sb.from('forum_threads').insert({
          kind: 'daily',
          category: 'previsao',
          spot_id: spot.id,
          forecast_date: now.date,
          title: s.title,
          body: s.body,
          author_id: null,
        })
        if (!e) out.posted++
        else if (e.code !== '23505') out.errors.push(`${spot.id} post: ${e.message}`)
      }
    }

    // 2. alertas de quem favoritou o pico
    for (const fav of favBySpot.get(spot.id) ?? []) {
      const key = `${fav.user_id}:${spot.id}`
      const r = await applyAlert(sb, {
        userId: fav.user_id,
        spot,
        prefs: normalizePrefs(fav.prefs as Record<string, unknown>),
        hours: f.hours,
        state: stateOf.get(key) ?? EMPTY_ALERT,
        phone: phoneOf.get(fav.user_id),
        site: SITE,
        now,
      })
      if (r.error) out.errors.push(r.error)
      stateOf.set(key, r.state)
      if (r.notified) out.notified++
      out.pushed += r.pushed
      out.whatsapp += r.whatsapp
    }
  })

  return json(out)
})
