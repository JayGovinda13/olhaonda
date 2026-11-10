/**
 * Ambiente em que o site está rodando.
 *  - production: site público (olhaonda.com)
 *  - staging:    homologação, para testar antes de publicar (dados e pagamentos de teste)
 *  - development: máquina local (npm run dev)
 *
 * Definido por VITE_APP_ENV; sem ele, deduz pelo modo do Vite (--mode staging / production).
 */
export type AppEnv = 'production' | 'staging' | 'development'

const fromVar = import.meta.env.VITE_APP_ENV as AppEnv | undefined
const fromMode: AppEnv =
  import.meta.env.MODE === 'production' ? 'production' : import.meta.env.MODE === 'staging' ? 'staging' : 'development'

export const APP_ENV: AppEnv = fromVar ?? fromMode
export const IS_PRODUCTION = APP_ENV === 'production'

const flag = (v: string | undefined, fallback: boolean) => (v == null || v === '' ? fallback : v === 'true')

/**
 * Recursos ligados por ambiente. Em produção, por enquanto, só a previsão:
 * fórum e fotos ficam desligados e seguem sendo testados em staging.
 * Para ligar em produção: VITE_FEATURE_FORUM=true / VITE_FEATURE_PHOTOS=true.
 */
export const FEATURES = {
  forum: flag(import.meta.env.VITE_FEATURE_FORUM, !IS_PRODUCTION),
  photos: flag(import.meta.env.VITE_FEATURE_PHOTOS, !IS_PRODUCTION),
}

/** Algum recurso que exige conta (login) está ligado. */
export const HAS_COMMUNITY = FEATURES.forum || FEATURES.photos

/**
 * Quais picos aparecem: 'prod' = estados da produção (SC, SP, RJ, ES e CE, só praias com onda); 'all' = todos.
 * Padrão: 'prod' em produção, 'all' nos outros ambientes.
 * Valores antigos de VITE_SPOT_SCOPE ('baixada', 'sp') valem como 'prod'.
 */
const scopeVar = import.meta.env.VITE_SPOT_SCOPE as string | undefined
export const SPOT_SCOPE: 'prod' | 'all' = scopeVar === 'all' ? 'all' : scopeVar ? 'prod' : IS_PRODUCTION ? 'prod' : 'all'
