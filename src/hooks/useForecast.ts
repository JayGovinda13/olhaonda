import { useCallback, useEffect, useState } from 'react'
import { fetchForecast, type Forecast } from '../api/openMeteo'
import type { Spot } from '../data/spots'

type Result = { key: string } & ({ data: Forecast; error?: undefined } | { data?: undefined; error: string })

export function useForecast(spot: Spot) {
  const [nonce, setNonce] = useState(0)
  const key = `${spot.lat},${spot.lon},${nonce}`
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchForecast(spot.lat, spot.lon, ctrl.signal)
      .then((data) => !ctrl.signal.aborted && setResult({ key, data }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        setResult({ key, error: e instanceof Error ? e.message : 'Erro desconhecido' })
      })
    return () => ctrl.abort()
  }, [spot.lat, spot.lon, key])

  const retry = useCallback(() => setNonce((n) => n + 1), [])

  // resultado de outro pico/tentativa = ainda carregando
  if (!result || result.key !== key) return { status: 'loading' as const, retry }
  if (result.error !== undefined) return { status: 'error' as const, error: result.error, retry }
  return { status: 'ready' as const, data: result.data, retry }
}
