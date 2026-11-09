import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

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

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), noindexOutsideProduction(mode)],
}))
