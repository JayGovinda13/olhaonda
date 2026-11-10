import { useEffect } from 'react'
import { useDemoAlerts } from '../hooks/useDemoAlerts'
import { usePendingFavorites } from '../hooks/useFavorites'
import { pushSupported, serviceWorker } from '../lib/push'

/** Tarefas de fundo da comunidade: favoritos do cadastro, alertas da demonstração, service worker. */
export function CommunityEffects() {
  usePendingFavorites()
  useDemoAlerts()
  useEffect(() => {
    // registra o service worker só se as notificações já foram liberadas (não pede nada sozinho)
    if (pushSupported() && Notification.permission === 'granted') void serviceWorker()
  }, [])
  return null
}
