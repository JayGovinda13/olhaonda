/**
 * Depois de uma atualização do site, quem estava com a aba aberta (ou a página guardada) pede arquivos que não existem mais.
 * O servidor responde com a página inicial e o navegador acusa "text/html is not a valid JavaScript MIME type".
 * Nesses casos recarregamos a página uma vez para pegar a versão nova.
 */
export const CHUNK_ERROR =
  /not a valid JavaScript MIME type|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

export const isChunkError = (e: unknown) => CHUNK_ERROR.test(String((e as Error | undefined)?.message ?? e))

/** Recarrega a página, no máximo uma vez a cada 30 s (sem entrar em loop). Devolve false se não recarregou. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem('olhaonda:reload') ?? 0)
    if (Date.now() - last < 30_000) return false
    sessionStorage.setItem('olhaonda:reload', String(Date.now()))
  } catch {
    /* sem storage: recarrega uma vez de qualquer jeito */
  }
  window.location.reload()
  return true
}
