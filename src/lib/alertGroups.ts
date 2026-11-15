import type { AppNotification } from '../backend'

export type NotificationGroup = { key: string; latest: AppNotification; older: AppNotification[] }

/**
 * Um bloco por pico: o aviso mais novo aparece inteiro e os anteriores do mesmo pico ficam recolhidos.
 * Marcações no fórum não se juntam (cada uma é de uma conversa). A lista chega do mais novo para o mais antigo.
 */
export function groupNotifications(list: AppNotification[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>()
  for (const n of list) {
    const key = n.kind === 'mention' ? `mention:${n.id}` : `spot:${n.spotId}`
    const g = groups.get(key)
    if (g) g.older.push(n)
    else groups.set(key, { key, latest: n, older: [] })
  }
  return [...groups.values()]
}
