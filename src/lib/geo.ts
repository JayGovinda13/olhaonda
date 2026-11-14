/**
 * Localização do aparelho.
 *
 * Cuidado com o `timeout` do navegador: no Safari (iPhone) e em alguns outros ele já conta enquanto o aviso
 * "Permitir localização?" está na tela. Com um prazo curto, o erro de tempo chega antes de a pessoa tocar em
 * "Permitir", e a permissão concedida depois não serve para aquela chamada (só funcionava no toque seguinte).
 * Por isso: prazo longo enquanto a permissão ainda não foi dada, curto depois dela, e uma nova tentativa
 * quando o erro for só de tempo.
 */
export type GeoResult = { ok: true; lat: number; lon: number } | { ok: false; reason: 'unsupported' | 'denied' | 'unavailable' }

function ask(timeout: number, maximumAge: number) {
  return new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout, maximumAge, enableHighAccuracy: false }),
  )
}

async function permissionState(): Promise<PermissionState | 'unknown'> {
  try {
    if (!navigator.permissions?.query) return 'unknown'
    return (await navigator.permissions.query({ name: 'geolocation' })).state
  } catch {
    return 'unknown' // Safari antigo não aceita 'geolocation' no Permissions API
  }
}

export async function getPosition(): Promise<GeoResult> {
  if (!navigator.geolocation) return { ok: false, reason: 'unsupported' }
  const state = await permissionState()
  if (state === 'denied') return { ok: false, reason: 'denied' }
  // 'granted': GPS já liberado, 12 s bastam. Qualquer outro caso: o aviso pode estar na tela, dá 60 s.
  const first = state === 'granted' ? 12_000 : 60_000
  try {
    const pos = await ask(first, 5 * 60_000)
    return { ok: true, lat: pos.coords.latitude, lon: pos.coords.longitude }
  } catch (e) {
    const err = e as GeolocationPositionError
    if (err.code === err.PERMISSION_DENIED) return { ok: false, reason: 'denied' }
    // tempo esgotado ou posição indisponível: a permissão pode ter acabado de ser dada, tenta mais uma vez
    try {
      const pos = await ask(20_000, 10 * 60_000)
      return { ok: true, lat: pos.coords.latitude, lon: pos.coords.longitude }
    } catch (e2) {
      const err2 = e2 as GeolocationPositionError
      return { ok: false, reason: err2.code === err2.PERMISSION_DENIED ? 'denied' : 'unavailable' }
    }
  }
}
