import { useCallback, useEffect, useState } from 'react'
import { backend, type AppNotification } from '../backend'
import { useAuth } from '../auth/context'

/** Notificações do usuário (sino do cabeçalho e "Meus picos"). */
export function useNotifications() {
  const { user } = useAuth()
  const [data, setData] = useState<{ uid: string; list: AppNotification[] } | null>(null)
  const uid = user?.id ?? null

  const refresh = useCallback(async () => {
    if (!uid) return
    try {
      const list = await backend.notifications.list()
      setData({ uid, list })
    } catch {
      /* sem rede: mantém o que tem */
    }
  }, [uid])

  useEffect(() => {
    if (!uid) return
    let alive = true
    const load = () =>
      backend.notifications
        .list()
        .then((list) => alive && setData({ uid, list }))
        .catch(() => {})
    void load()
    const off = backend.notifications.onChange(() => void load())
    const t = setInterval(() => void load(), 5 * 60_000)
    return () => {
      alive = false
      off()
      clearInterval(t)
    }
  }, [uid])

  const list = data && data.uid === uid ? data.list : []
  const markRead = useCallback(
    async (ids: string[] | 'all') => {
      await backend.notifications.markRead(ids)
      await refresh()
    },
    [refresh],
  )
  return { list, unread: list.filter((n) => !n.readAt).length, markRead, refresh }
}
