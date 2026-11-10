// Envio de Web Push (VAPID). Chaves: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…).
import webpush from 'npm:web-push@3.6.7'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

let ready: boolean | null = null
function setup() {
  if (ready != null) return ready
  const pub = Deno.env.get('VAPID_PUBLIC_KEY')
  const priv = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@olhaonda.com'
  ready = Boolean(pub && priv)
  if (ready) webpush.setVapidDetails(subject, pub!, priv!)
  return ready
}

export type PushPayload = { title: string; body: string; url: string; tag?: string }

/** Envia para todas as inscrições do usuário; remove as que o navegador já cancelou. Devolve quantas receberam. */
export async function pushToUser(sb: SupabaseClient, userId: string, payload: PushPayload) {
  if (!setup()) return 0
  const { data: subs } = await sb.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', userId)
  let sent = 0
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 6 * 3600 })
      sent++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      else console.error('push falhou', status, e)
    }
  }
  return sent
}
