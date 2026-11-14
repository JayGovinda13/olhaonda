import type { AppNotification } from '../backend'
import { brand } from '../theme'

/** Como cada tipo de aviso aparece no sino e em "Meus picos". */
export const ALERT_KIND: Record<AppNotification['kind'], { emoji: string; label: string; color: string }> = {
  enter: { emoji: '🌊', label: 'Entrou na sua condição', color: brand.green },
  back: { emoji: '✅', label: 'Voltou a ficar do seu gosto', color: brand.green },
  change: { emoji: '🔄', label: 'A previsão mudou', color: brand.plum },
  lost: { emoji: '⚠️', label: 'Saiu da sua condição', color: '#B3541E' },
  match: { emoji: '🌊', label: 'Condição do seu gosto', color: brand.green },
}
