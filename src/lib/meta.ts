import { useEffect } from 'react'

/** Endereço público definitivo (canônico). O www e o pages.dev apontam para cá. */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://olhaonda.com').replace(/\/$/, '')

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

const meta = (key: 'name' | 'property', name: string) => () => {
  const m = document.createElement('meta')
  m.setAttribute(key, name)
  return m
}

/**
 * Título, descrição e endereço canônico da página (buscadores e o robô do AdSense leem isso).
 * O canônico evita que www.olhaonda.com e olhaonda.pages.dev contem como sites duplicados.
 */
export function usePageMeta({ title, description, path }: { title: string; description: string; path: string }) {
  useEffect(() => {
    const url = SITE_URL + path
    document.title = title
    setTag('meta[name="description"]', meta('name', 'description'), 'content', description)
    setTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url)
    setTag('meta[property="og:title"]', meta('property', 'og:title'), 'content', title)
    setTag('meta[property="og:description"]', meta('property', 'og:description'), 'content', description)
    setTag('meta[property="og:url"]', meta('property', 'og:url'), 'content', url)
  }, [title, description, path])
}
