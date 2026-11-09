import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { readFileSync } from 'node:fs'

/** Fora de produção, pede aos buscadores para não indexar (staging não pode aparecer no Google). */
function noindexOutsideProduction(mode: string): Plugin {
  return {
    name: 'olhaonda-noindex',
    transformIndexHtml(html) {
      if (mode === 'production') return html
      return html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />')
    },
  }
}

/**
 * Google AdSense em produção, a partir de VITE_ADSENSE_CLIENT ("ca-pub-…"):
 *  - meta tag google-adsense-account (verificação do site no painel do AdSense)
 *  - /ads.txt autorizando o Google a vender o inventário (sem ele a receita cai)
 */
function adsense(mode: string, client: string | undefined): Plugin {
  const enabled = mode === 'production' && !!client && /^ca-pub-\d+$/.test(client)
  return {
    name: 'olhaonda-adsense',
    transformIndexHtml(html) {
      if (!enabled) return html
      return html.replace('</head>', `    <meta name="google-adsense-account" content="${client}" />\n  </head>`)
    },
    generateBundle() {
      if (!enabled) return
      const pub = client!.replace(/^ca-/, '')
      this.emitFile({ type: 'asset', fileName: 'ads.txt', source: `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` })
    },
  }
}

/**
 * robots.txt e sitemap.xml gerados no build.
 *  - produção: libera tudo e lista a home, as páginas fixas e todos os picos do ambiente
 *  - staging/dev: bloqueia os buscadores
 * Os picos vêm do próprio src/data/spots.ts (carregado pelo Vite com o mesmo modo do build).
 */
function seo(mode: string, siteUrl: string): Plugin {
  return {
    name: 'olhaonda-seo',
    apply: 'build',
    async generateBundle() {
      if (mode !== 'production') {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nDisallow: /\n' })
        return
      }
      const { createServer } = await import('vite')
      const server = await createServer({
        mode,
        configFile: false,
        logLevel: 'silent',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false, ws: false },
      })
      let ids: string[] = []
      try {
        const mod = (await server.ssrLoadModule('/src/data/spots.ts')) as { SPOTS: { id: string }[] }
        ids = mod.SPOTS.map((s) => s.id)
      } finally {
        await server.close()
      }
      const today = new Date().toISOString().slice(0, 10)
      const url = (path: string, freq: string, prio: string) =>
        `  <url><loc>${siteUrl}${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`
      const urls = [
        url('/', 'daily', '1.0'),
        ...ids.map((id) => url(`/pico/${id}`, 'hourly', '0.8')),
        url('/sobre', 'monthly', '0.4'),
        url('/privacidade', 'yearly', '0.2'),
      ]
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` })
    },
  }
}

/** No HTML de produção: endereço canônico e dados para compartilhamento (WhatsApp, redes sociais). */
function canonical(mode: string, siteUrl: string): Plugin {
  return {
    name: 'olhaonda-canonical',
    transformIndexHtml(html) {
      if (mode !== 'production') return html
      return html.replace(
        '</head>',
        `    <link rel="canonical" href="${siteUrl}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="OlhaOnda" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:title" content="OlhaOnda · Previsão de ondas para surf e bodyboard" />
    <meta property="og:description" content="Previsão de ondas para surf e bodyboard: swell, vento terral ou maral, maré e tempo, hora a hora." />
  </head>`,
      )
    },
  }
}

/** ID de editor padrão, lido de src/config/adsenseId.ts (fonte única, usada também pelo app). */
const ADSENSE_PUBLISHER = readFileSync(new URL('./src/config/adsenseId.ts', import.meta.url), 'utf8').match(/ca-pub-\d+/)?.[0]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || 'https://olhaonda.com').replace(/\/$/, '')
  return {
    plugins: [
      react(),
      noindexOutsideProduction(mode),
      adsense(mode, env.VITE_ADSENSE_CLIENT || ADSENSE_PUBLISHER),
      seo(mode, siteUrl),
      canonical(mode, siteUrl),
    ],
  }
})
