// Build usado pela hospedagem (deploy automático). Escolhe o modo pela branch:
//   main            -> produção  (vite build --mode production)
//   qualquer outra  -> staging   (vite build --mode staging)
// Funciona na Cloudflare Pages (CF_PAGES_BRANCH), na Vercel (VERCEL_GIT_COMMIT_REF)
// e no GitHub Actions (GITHUB_REF_NAME). APP_MODE força um modo, se preciso.
import { execSync } from 'node:child_process'

const branch = process.env.CF_PAGES_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || ''
const mode = process.env.APP_MODE || (branch === 'main' ? 'production' : 'staging')
console.log(`[olhaonda] branch "${branch || '?'}" -> modo ${mode}`)
execSync(`npx tsc -b && npx vite build --mode ${mode}`, { stdio: 'inherit' })
