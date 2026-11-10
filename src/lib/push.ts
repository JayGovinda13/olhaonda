/**
 * Notificações no navegador.
 *  - Com servidor de push (Supabase + chave VAPID): inscreve o navegador e salva a inscrição;
 *    a Edge Function daily-forecast envia os alertas mesmo com o site fechado.
 *  - Sem servidor (modo demonstração): avisos locais, mostrados quando o site está aberto.
 */
import { backend } from '../backend'

export type PushState = 'unsupported' | 'denied' | 'off' | 'on'

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window

let reg: Promise<ServiceWorkerRegistration | null> | null = null
export function serviceWorker() {
  if (!pushSupported()) return Promise.resolve(null)
  reg ??= navigator.serviceWorker.register('/sw.js').then(
    () => navigator.serviceWorker.ready,
    () => null,
  )
  return reg
}

function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  if (!backend.push.vapidPublicKey) return 'on' // avisos locais
  const r = await serviceWorker()
  const sub = await r?.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

/** Pede permissão e liga as notificações neste aparelho. */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'
  const r = await serviceWorker()
  const key = backend.push.vapidPublicKey
  if (r && key) {
    const sub =
      (await r.pushManager.getSubscription()) ??
      (await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) }))
    await backend.push.subscribe(sub.toJSON())
  }
  return 'on'
}

export async function disablePush() {
  const r = await serviceWorker()
  const sub = await r?.pushManager.getSubscription()
  if (sub) {
    await backend.push.unsubscribe(sub.endpoint).catch(() => {})
    await sub.unsubscribe()
  }
}

/** Aviso local (modo demonstração ou teste). */
export async function localNotify(title: string, body: string, url: string, tag?: string) {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const r = await serviceWorker()
  if (!r) return false
  await r.showNotification(title, { body, tag, icon: '/icon-192.png', data: { url } })
  return true
}
