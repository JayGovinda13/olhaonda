import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), noindexOutsideProduction(mode), adsense(mode, env.VITE_ADSENSE_CLIENT)],
  }
})
