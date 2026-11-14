// Aplica o ciclo de aviso de UM pico favorito de UMA pessoa: avalia a previsão, grava a notificação, manda push e WhatsApp
// e guarda o estado. Usado pela rodada diária (daily-forecast) e pela conferência na hora (alerts-now).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { evaluateAlert, type AlertState } from './core/alerts.ts'
import type { HourPoint } from './core/openMeteo.ts'
import type { SpotPrefs } from './core/prefs.ts'
import type { Spot } from './core/spots.ts'
import { pushToUser } from './push.ts'
import { alertTemplate, sendTemplate } from './whatsapp.ts'

export type AlertResult = { state: AlertState; notified: boolean; pushed: number; whatsapp: number; error?: string }

export async function applyAlert(
  sb: SupabaseClient,
  o: { userId: string; spot: Spot; prefs: SpotPrefs; hours: HourPoint[]; state: AlertState; phone?: string; site: string; now: Parameters<typeof evaluateAlert>[4] },
): Promise<AlertResult> {
  const { state, event } = evaluateAlert(o.spot, o.hours, o.prefs, o.state, o.now)
  const res: AlertResult = { state, notified: false, pushed: 0, whatsapp: 0 }
  if (event) {
    const { error: e } = await sb.from('notifications').insert({
      user_id: o.userId,
      spot_id: o.spot.id,
      kind: event.type,
      event_seq: event.seq,
      session_date: event.sessionDate,
      title: event.title,
      body: event.body,
      url: event.url,
    })
    if (e && e.code !== '23505') return { ...res, state: o.state, error: `${o.spot.id} alerta: ${e.message}` } // não grava o estado: tenta de novo depois
    if (!e) {
      res.notified = true
      const link = `${o.site}${event.url}`
      res.pushed = await pushToUser(sb, o.userId, { title: event.title, body: event.body, url: link, tag: o.spot.id })
      if (o.phone) {
        const t = alertTemplate(o.spot.name, event, link)
        const r = await sendTemplate(sb, o.userId, o.phone, t.name, t.params)
        if (r.status === 'failed') res.error = `${o.spot.id} whatsapp: ${r.error}`
        else res.whatsapp = 1
      }
    }
  }
  const { error: se } = await sb.from('alert_state').upsert({ user_id: o.userId, spot_id: o.spot.id, state, updated_at: new Date().toISOString() })
  if (se) res.error = `${o.spot.id} estado: ${se.message}`
  return res
}
