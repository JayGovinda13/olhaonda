// Rodada diária (chamada pelo agendador com o cabeçalho x-cron-secret):
//  1. publica no fórum de cada pico o resumo da previsão do dia, assinado pelo OlhaOnda
//  2. confere os picos favoritos de cada usuário contra a previsão e avisa (no site e por push)
//     quando houver uma janela que bate com as condições preferidas.
// Os cálculos são os mesmos do site (supabase/functions/_shared/core).
import { admin, env, json } from '../_shared/util.ts'
import { pushToUser } from '../_shared/push.ts'
import { fetchForecastRaw, type Forecast } from '../_shared/core/openMeteo.ts'
import { describeMatch, findMatches, normalizePrefs } from '../_shared/core/prefs.ts'
import { ALL_SPOTS, spotsForScope, type Spot } from '../_shared/core/spots.ts'
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
  if (req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ error: 'forbidden' }, 403)
  const url = new URL(req.url)
  const onlyAlerts = url.searchParams.get('only') === 'alerts'
  const sb = admin()
  const scope = (Deno.env.get('SPOT_SCOPE') === 'baixada' ? 'baixada' : 'all') as 'baixada' | 'all'
  const apiKey = Deno.env.get('OPEN_METEO_API_KEY') || undefined
  const now = localNow()

  const { data: favs, error } = await sb.from('favorite_spots').select('user_id, spot_id, prefs').eq('notify', true)
  if (error) return json({ error: error.message }, 500)
  const favBySpot = new Map<string, { user_id: string; prefs: unknown }[]>()
  for (const f of favs ?? []) {
    if (!favBySpot.has(f.spot_id)) favBySpot.set(f.spot_id, [])
    favBySpot.get(f.spot_id)!.push(f)
  }

  // picos do ambiente + qualquer pico favoritado
  const spots: Spot[] = onlyAlerts ? [] : spotsForScope(scope)
  for (const id of favBySpot.keys()) if (!spots.some((s) => s.id === id)) {
    const s = ALL_SPOTS.find((x) => x.id === id)
    if (s) spots.push(s)
  }

  const out = { date: now.date, spots: spots.length, posted: 0, notified: 0, pushed: 0, errors: [] as string[] }

  await pool(spots, 4, async (spot) => {
    let f: Forecast
    try {
      f = await fetchForecastRaw(spot.lat, spot.lon, { apiKey })
    } catch (e) {
      out.errors.push(`${spot.id}: ${(e as Error).message}`)
      return
    }

    // 1. resumo do dia no fórum do pico (um por dia: o índice único barra repetidos)
    if (!onlyAlerts && spotsForScope(scope).some((s) => s.id === spot.id)) {
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
      const prefs = normalizePrefs(fav.prefs as Record<string, unknown>)
      for (const m of findMatches(spot, f.hours, prefs, now.hour)) {
        const title = `${spot.name}: condição do seu gosto`
        const body = describeMatch(m)
        const link = `${SITE}/pico/${spot.id}?t=${encodeURIComponent(m.start)}`
        const { error: e } = await sb.from('notifications').insert({
          user_id: fav.user_id,
          spot_id: spot.id,
          session_date: m.date,
          title,
          body,
          url: `/pico/${spot.id}?t=${encodeURIComponent(m.start)}`,
        })
        if (e) {
          if (e.code !== '23505') out.errors.push(`${spot.id} alerta: ${e.message}`)
          continue // já avisado para esse dia
        }
        out.notified++
        out.pushed += await pushToUser(sb, fav.user_id, { title, body, url: link, tag: `${spot.id}:${m.date}` })
      }
    }
  })

  return json(out)
})
