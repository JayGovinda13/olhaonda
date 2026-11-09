import { ADSENSE_PUBLISHER } from './adsenseId'
import { IS_PRODUCTION } from './env'

/**
 * Google AdSense.
 * Só em produção: cliques de teste em staging podem suspender a conta.
 * VITE_ADSENSE_CLIENT = "ca-pub-…" (o build de produção também gera ads.txt e a meta tag de verificação).
 */
export const ADSENSE_CLIENT = IS_PRODUCTION ? ((import.meta.env.VITE_ADSENSE_CLIENT as string | undefined) || ADSENSE_PUBLISHER) : undefined

/** AdSense configurado neste ambiente. */
export const ADS_ENABLED = Boolean(ADSENSE_CLIENT)
