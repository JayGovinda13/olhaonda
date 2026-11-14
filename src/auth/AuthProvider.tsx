import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend, type Profile } from '../backend'
import { AuthContext } from './context'
import { SignInDialog } from './SignInDialog'

type Pending = { reason?: string; resolve: (ok: boolean) => void }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)
  const [dialog, setDialog] = useState<Pending | null>(null)
  const pending = useRef<Pending | null>(null)

  const closeDialog = useCallback((ok: boolean) => {
    pending.current?.resolve(ok)
    pending.current = null
    setDialog(null)
  }, [])

  const apply = useCallback(
    (p: Profile | null) => {
      setUser(p)
      if (p && pending.current) closeDialog(true)
    },
    [closeDialog],
  )

  // chegou por um link de redefinição de senha (mesmo que o e-mail aponte para outra página): abre a tela de nova senha
  useEffect(() => {
    const go = () => {
      if (location.pathname !== '/redefinir-senha') {
        window.history.pushState({}, '', '/redefinir-senha')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }
    if (backend.auth.recoveryActive()) go()
    return backend.auth.onRecovery(go)
  }, [])

  useEffect(() => {
    let alive = true
    backend.auth.current().then((p) => {
      if (!alive) return
      apply(p)
      setReady(true)
    })
    const off = backend.auth.onChange((p) => alive && apply(p))
    return () => {
      alive = false
      off()
    }
  }, [apply])

  const requireLogin = useCallback(
    (reason?: string) => {
      if (user) return Promise.resolve(true)
      return new Promise<boolean>((resolve) => {
        pending.current = { reason, resolve }
        setDialog(pending.current)
      })
    },
    [user],
  )

  const refresh = useCallback(async () => apply(await backend.auth.current()), [apply])
  const value = useMemo(() => ({ user, ready, requireLogin, refresh }), [user, ready, requireLogin, refresh])

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInDialog open={!!dialog} reason={dialog?.reason} onClose={() => closeDialog(false)} />
    </AuthContext.Provider>
  )
}
