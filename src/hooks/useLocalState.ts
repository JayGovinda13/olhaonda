import { useEffect, useState } from 'react'

/** Estado persistido no navegador; funciona normalmente se o storage estiver bloqueado. */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw == null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage indisponível */
    }
  }, [key, value])
  return [value, setValue] as const
}
