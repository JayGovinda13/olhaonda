/**
 * Ambiente em que o site está rodando.
 *  - production: site público (olhaonda.com.br)
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
