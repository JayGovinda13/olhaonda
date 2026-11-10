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
 * Quais picos aparecem: 'sp' = litoral de São Paulo com onda; 'all' = todos.
 * Padrão: 'sp' em produção, 'all' nos outros ambientes.
 * 'baixada' (valor antigo de VITE_SPOT_SCOPE, quando a produção era só a Baixada) vale como 'sp':
 * a produção passou a cobrir o litoral paulista inteiro.
 */
const scopeVar = import.meta.env.VITE_SPOT_SCOPE as string | undefined
export const SPOT_SCOPE: 'sp' | 'all' = scopeVar === 'all' ? 'all' : scopeVar ? 'sp' : IS_PRODUCTION ? 'sp' : 'all'
