import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { backend, type Favorite, type SpotPrefs } from '../backend'
import { useAuth } from '../auth/context'
import { DEFAULT_PREFS } from '../../supabase/functions/_shared/core/prefs.ts'

/** Favoritos do usuário logado, compartilhados entre todos os componentes da página. */
type State = { userId: string | null; list: Favorite[] | null }
let state: State = { userId: null, list: null }
const subs = new Set<() => void>()
const emit = (next: State) => {
  state = next
  subs.forEach((f) => f())
}
const subscribe = (f: () => void) => {
  subs.add(f)
  return () => void subs.delete(f)
}

let loading: string | null = null
async function load(userId: string) {
  if (loading === userId) return
  loading = userId
  try {
    const list = await backend.favorites.list()
    if (loading === userId) emit({ userId, list })
  } catch {
    if (loading === userId) emit({ userId, list: [] })
  } finally {
    loading = null
  }
}

export function useFavorites() {
  const { user } = useAuth()
  const s = useSyncExternalStore(subscribe, () => state)
  const uid = user?.id ?? null

  useEffect(() => {
    if (!uid) {
      if (state.userId) emit({ userId: null, list: null })
      return
    }
    if (state.userId !== uid) {
      emit({ userId: uid, list: null })
      void load(uid)
    }
  }, [uid])

  const list = s.userId === uid ? s.list : null

  const save = useCallback(async (spotId: string, prefs: SpotPrefs, notify: boolean) => {
    const fav = await backend.favorites.save(spotId, prefs, notify)
    emit({ ...state, list: [...(state.list ?? []).filter((f) => f.spotId !== spotId), fav] })
    return fav
  }, [])

  const remove = useCallback(async (spotId: string) => {
    await backend.favorites.remove(spotId)
    emit({ ...state, list: (state.list ?? []).filter((f) => f.spotId !== spotId) })
  }, [])

  return { favorites: list, get: (spotId: string) => list?.find((f) => f.spotId === spotId) ?? null, save, remove }
}

const PENDING = 'olhaonda:pending-favs'

/** Picos escolhidos no cadastro, guardados até a pessoa confirmar o e-mail e entrar. */
export function setPendingFavorites(ids: string[]) {
  try {
    if (ids.length) localStorage.setItem(PENDING, JSON.stringify(ids))
  } catch {
    /* sem storage */
  }
}

/** Depois do primeiro login, salva os picos do cadastro como favoritos (condições padrão). */
export function usePendingFavorites() {
  const { user } = useAuth()
  const { save } = useFavorites()
  const uid = user?.id
  useEffect(() => {
    if (!uid) return
    let ids: string[] = []
    try {
      ids = JSON.parse(localStorage.getItem(PENDING) ?? '[]') as string[]
      localStorage.removeItem(PENDING)
    } catch {
      return
    }
    for (const id of ids) void save(id, DEFAULT_PREFS, true).catch(() => {})
  }, [uid, save])
}
