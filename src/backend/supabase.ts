/**
 * Backend real: Supabase (Auth + Postgres com RLS + Storage + Edge Functions).
 * Esquema em supabase/migrations; pagamentos em supabase/functions.
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { EMPTY_ALERT, type AlertState } from '../../supabase/functions/_shared/core/alerts.ts'
import type { SpotPrefs } from '../../supabase/functions/_shared/core/prefs.ts'
import { normalizePrefs } from '../../supabase/functions/_shared/core/prefs.ts'
import { notifyAlertsChanged } from '../lib/alertsBus'
import { TERMS_VERSION } from './types'
import type { AdminOverview, AppNotification, Backend, Favorite, ForumCategory, Level, Modality, Photo, PhotoSession, Post, Profile, Purchase, Thread } from './types'

type Row = Record<string, unknown>

const str = (v: unknown) => (v == null ? '' : String(v))

function toThread(r: Row): Thread {
  return {
    id: str(r.id),
    title: str(r.title),
    body: str(r.body),
    category: r.category as ForumCategory,
    spotId: (r.spot_id as string | null) ?? null,
    authorId: str(r.author_id),
    authorName: str(r.author_name),
    authorUsername: (r.author_username as string | null) ?? null,
    createdAt: str(r.created_at),
    lastActivityAt: str(r.last_activity_at),
    replyCount: Number(r.reply_count ?? 0),
    kind: r.kind === 'daily' ? 'daily' : 'user',
    forecastDate: (r.forecast_date as string | null) ?? null,
  }
}

function toFavorite(r: Row): Favorite {
  return {
    spotId: str(r.spot_id),
    prefs: normalizePrefs(r.prefs as Partial<SpotPrefs>),
    notify: Boolean(r.notify),
    createdAt: str(r.created_at),
  }
}

function toNotification(r: Row): AppNotification {
  return {
    id: str(r.id),
    spotId: str(r.spot_id),
    kind: (['enter', 'back', 'change', 'lost', 'mention'].includes(r.kind as string) ? r.kind : 'match') as AppNotification['kind'],
    sessionDate: str(r.session_date),
    title: str(r.title),
    body: str(r.body),
    url: str(r.url),
    createdAt: str(r.created_at),
    readAt: (r.read_at as string | null) ?? null,
  }
}

function toPost(r: Row): Post {
  return {
    id: str(r.id),
    threadId: str(r.thread_id),
    body: str(r.body),
    authorId: str(r.author_id),
    authorName: str(r.author_name),
    authorUsername: (r.author_username as string | null) ?? null,
    createdAt: str(r.created_at),
  }
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const sb: SupabaseClient = createClient(url, anonKey)

  // Link de redefinição de senha: o Supabase abre uma sessão especial (evento PASSWORD_RECOVERY). Guardamos a marca na aba
  // para a tela de nova senha só funcionar para quem veio do link (e não para qualquer sessão aberta).
  const RECOVERY = 'olhaonda:recovery'
  const recoveryListeners = new Set<() => void>()
  const setRecovery = (on: boolean) => {
    try {
      if (on) sessionStorage.setItem(RECOVERY, '1')
      else sessionStorage.removeItem(RECOVERY)
    } catch {
      /* sem storage */
    }
  }
  if (typeof location !== 'undefined' && /type=recovery/.test(location.hash)) setRecovery(true)
  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      setRecovery(true)
      recoveryListeners.forEach((l) => l())
    }
    if (event === 'SIGNED_OUT') setRecovery(false)
  })
  const previewUrl = (path: string | null | undefined) =>
    path ? sb.storage.from('previews').getPublicUrl(path).data.publicUrl : null

  const toSession = (r: Row): PhotoSession => ({
    id: str(r.id),
    photographerId: str(r.photographer_id),
    photographerName: str(r.photographer_name),
    spotId: str(r.spot_id),
    date: str(r.date),
    period: r.period as PhotoSession['period'],
    title: (r.title as string | null) ?? null,
    priceCents: Number(r.price_cents),
    coverUrl: previewUrl(r.cover_path as string | null),
    photoCount: Number(r.photo_count ?? 0),
    createdAt: str(r.created_at),
  })

  const toPhoto = (r: Row): Photo => ({
    id: str(r.id),
    sessionId: str(r.session_id),
    previewUrl: previewUrl(r.preview_path as string) ?? '',
    width: Number(r.width),
    height: Number(r.height),
  })

  async function loadProfile(user: User | null | undefined): Promise<Profile | null> {
    if (!user) return null
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
    return {
      id: user.id,
      name: (data?.display_name as string) ?? user.email?.split('@')[0] ?? 'Surfista',
      avatarUrl: (data?.avatar_url as string | null) ?? null,
      isPhotographer: Boolean(data?.is_photographer),
      paymentsConnected: Boolean(data?.payments_connected),
      instagram: (data?.instagram as string | null) ?? null,
      username: (data?.username as string | null) ?? null,
      city: (data?.city as string | null) ?? null,
      modality: (data?.modality as Modality | null) ?? null,
      level: (data?.level as Level | null) ?? null,
      bio: (data?.bio as string | null) ?? null,
      email: user.email ?? null,
      hasPassword: user.app_metadata?.provider === 'email',
      approved: Boolean((await sb.rpc('is_member')).data),
      isAdmin: data?.role === 'admin',
    }
  }

  async function uidOrThrow() {
    const { data } = await sb.auth.getUser()
    if (!data.user) throw new Error('Entre na sua conta para continuar.')
    return data.user.id
  }

  function check<T>(res: { data: T; error: { message: string; code?: string } | null }) {
    // 42501 = o banco recusou: no teste fechado, conta ainda não liberada
    if (res.error) throw new Error(res.error.code === '42501' ? 'Seu acesso ainda não foi liberado.' : res.error.message)
    return res.data
  }

  async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
    const { data, error } = await sb.functions.invoke(fn, { body })
    if (error) {
      // tenta extrair a mensagem enviada pela função
      const ctx = (error as { context?: Response }).context
      const msg = ctx ? await ctx.json().then((j: { error?: string }) => j.error).catch(() => null) : null
      throw new Error(msg ?? error.message)
    }
    return data as T
  }

  const redirectTo = () => `${location.origin}${location.pathname}`

  return {
    mode: 'supabase',

    auth: {
      async current() {
        const { data } = await sb.auth.getSession()
        return loadProfile(data.session?.user)
      },
      onChange(cb) {
        const { data } = sb.auth.onAuthStateChange((_e, session) => {
          // não aguardar dentro do callback (recomendação do supabase-js)
          setTimeout(() => void loadProfile(session?.user).then(cb), 0)
        })
        return () => data.subscription.unsubscribe()
      },
      async signInWithEmail(email) {
        check(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } }))
      },
      async signInWithPassword(email, password) {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
      },
      async signUp(input) {
        const { data, error } = await sb.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: {
            emailRedirectTo: `${location.origin}/`,
            // vai para raw_user_meta_data; o gatilho handle_new_user cria o perfil com esses dados
            data: {
              display_name: input.name.trim(),
              username: input.username.trim().toLowerCase(),
              city: input.city.trim(),
              modality: input.modality,
              level: input.level,
              terms_version: TERMS_VERSION, // aceite da política de privacidade e das regras (LGPD)
              invite: input.invite ?? '', // o banco só cria a conta com convite válido
            },
          },
        })
        if (error) {
          if (error.message === 'User already registered') throw new Error('Já existe uma conta com esse e-mail.')
          if (/convite|Database error saving new user/i.test(error.message)) throw new Error('Esse convite não vale mais. Peça um novo link a quem te convidou.')
          throw new Error(error.message)
        }
        return { needsConfirmation: !data.session }
      },
      async usernameAvailable(username) {
        const { data, error } = await sb.rpc('username_available', { name: username.trim().toLowerCase() })
        if (error) return true // na dúvida não bloqueia; o banco garante a unicidade
        return Boolean(data)
      },
      async inviteValid(code) {
        const { data, error } = await sb.rpc('invite_valid', { invite_code: code.trim() })
        return !error && data === true
      },
      async requestPasswordReset(email) {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/redefinir-senha` })
        if (error && /rate|seconds|too many/i.test(error.message)) throw new Error('Aguarde um minuto para pedir outro link.')
        return {} // sempre a mesma resposta: não revela se o e-mail tem conta
      },
      recoveryActive() {
        try {
          return sessionStorage.getItem(RECOVERY) === '1'
        } catch {
          return false
        }
      },
      onRecovery(cb) {
        recoveryListeners.add(cb)
        return () => void recoveryListeners.delete(cb)
      },
      async setNewPassword(next) {
        const { data } = await sb.auth.getSession()
        let active = false
        try {
          active = sessionStorage.getItem(RECOVERY) === '1'
        } catch {
          /* sem storage */
        }
        if (!data.session || !active) throw new Error('Este link não vale mais. Peça um novo em "Esqueci minha senha".')
        if (next.length < 8) throw new Error('A nova senha precisa ter pelo menos 8 caracteres.')
        const { error } = await sb.auth.updateUser({ password: next })
        if (error) throw new Error(/different|same/i.test(error.message) ? 'A nova senha precisa ser diferente da anterior.' : error.message)
        setRecovery(false)
        // quem perdeu a senha pode ter deixado outros aparelhos conectados: encerra os outros
        await sb.auth.signOut({ scope: 'others' }).catch(() => {})
      },
      async changePassword(current, next) {
        const { data } = await sb.auth.getUser()
        const email = data.user?.email
        if (!email) throw new Error('Entre na sua conta para continuar.')
        if (next.length < 8) throw new Error('A nova senha precisa ter pelo menos 8 caracteres.')
        // confere a senha atual: quem pegar o celular aberto não consegue trocar a senha da conta
        const check = await sb.auth.signInWithPassword({ email, password: current })
        if (check.error) throw new Error('Senha atual incorreta.')
        const { error } = await sb.auth.updateUser({ password: next })
        if (error) throw new Error(/different|same/i.test(error.message) ? 'A nova senha precisa ser diferente da atual.' : error.message)
      },
      async updateProfile(patch) {
        const id = await uidOrThrow()
        const row: Record<string, unknown> = {}
        if (patch.name !== undefined) row.display_name = patch.name
        if (patch.username !== undefined) row.username = patch.username?.toLowerCase() || null
        for (const k of ['city', 'modality', 'level', 'bio'] as const) if (patch[k] !== undefined) row[k] = patch[k]
        const { error } = await sb.from('profiles').update(row).eq('id', id)
        if (error) throw new Error(error.code === '23505' ? 'Esse apelido já está em uso.' : error.message)
        await sb.auth.refreshSession()
      },
      async signInWithGoogle() {
        const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } })
        if (error) throw new Error(error.message)
      },
      async signOut() {
        await sb.auth.signOut()
      },
      async becomePhotographer(instagram) {
        const id = await uidOrThrow()
        check(await sb.from('profiles').update({ is_photographer: true, instagram }).eq('id', id))
        // renovar a sessão dispara onAuthStateChange e recarrega o perfil nos listeners
        await sb.auth.refreshSession()
      },
    },

    forum: {
      async listThreads({ category, spotId }) {
        let q = sb.from('forum_threads_v').select('*').order('last_activity_at', { ascending: false }).limit(100)
        if (category) q = q.eq('category', category)
        if (spotId) q = q.eq('spot_id', spotId)
        return (check(await q) as Row[]).map(toThread)
      },
      async getThread(id) {
        const t = check(await sb.from('forum_threads_v').select('*').eq('id', id).maybeSingle()) as Row | null
        if (!t) return null
        const posts = check(
          await sb.from('forum_posts_v').select('*').eq('thread_id', id).order('created_at', { ascending: true }),
        ) as Row[]
        return { thread: toThread(t), posts: posts.map(toPost) }
      },
      async createThread(input) {
        await uidOrThrow()
        const row = check(
          await sb
            .from('forum_threads')
            .insert({ title: input.title, body: input.body, category: input.category, spot_id: input.spotId })
            .select('id')
            .single(),
        ) as Row
        const full = check(await sb.from('forum_threads_v').select('*').eq('id', row.id).single()) as Row
        return toThread(full)
      },
      async reply(threadId, body) {
        await uidOrThrow()
        const row = check(await sb.from('forum_posts').insert({ thread_id: threadId, body }).select('id').single()) as Row
        const full = check(await sb.from('forum_posts_v').select('*').eq('id', row.id).single()) as Row
        return toPost(full)
      },
      async searchMembers(query) {
        const { data, error } = await sb.rpc('forum_member_search', { q: query })
        if (error) return []
        return ((data ?? []) as Row[]).map((r) => ({ username: str(r.username), name: str(r.name) }))
      },
      async deletePost(postId) {
        check(await sb.from('forum_posts').delete().eq('id', postId))
      },
    },

    favorites: {
      async list() {
        const id = await uidOrThrow()
        return (check(await sb.from('favorite_spots').select('*').eq('user_id', id).order('created_at')) as Row[]).map(toFavorite)
      },
      async save(spotId, prefs, notify) {
        const id = await uidOrThrow()
        const row = check(
          await sb.from('favorite_spots').upsert({ user_id: id, spot_id: spotId, prefs, notify }).select('*').single(),
        ) as Row
        // confere o aviso na hora (em vez de esperar a próxima rodada do servidor) e avisa as telas para atualizar
        if (notify) void invoke('alerts-now', { spotId }).then(notifyAlertsChanged, notifyAlertsChanged)
        return toFavorite(row)
      },
      async remove(spotId) {
        const id = await uidOrThrow()
        check(await sb.from('favorite_spots').delete().eq('user_id', id).eq('spot_id', spotId))
      },
    },

    notifications: {
      async list() {
        const { data: s } = await sb.auth.getSession()
        if (!s.session) return []
        return (check(await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)) as Row[]).map(toNotification)
      },
      async markRead(ids) {
        let q = sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
        if (ids !== 'all') q = q.in('id', ids)
        check(await q)
      },
      onChange(cb) {
        // novas notificações chegam pela Edge Function; o realtime avisa o site aberto.
        // Um canal por assinatura (nome único): dois componentes ouvindo ao mesmo tempo não podem dividir o mesmo canal.
        // Se o tempo real falhar, o app segue funcionando (a lista também atualiza sozinha a cada 5 minutos).
        try {
          const ch = sb
            .channel(`notifications:${Math.random().toString(36).slice(2)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => cb())
            .subscribe()
          return () => void sb.removeChannel(ch)
        } catch (e) {
          console.warn('Tempo real indisponível', e)
          return () => {}
        }
      },
    },

    admin: {
      async overview() {
        return check(await sb.rpc('admin_overview')) as AdminOverview
      },
      async setAccess(userId, allow) {
        const { error } = await sb.rpc('admin_set_access', { target: userId, allow })
        if (error) throw new Error(error.message)
      },
      async createInvite({ label, maxUses, validDays }) {
        const { data, error } = await sb.rpc('admin_create_invite', { invite_label: label ?? null, uses_limit: maxUses ?? null, valid_days: validDays ?? null })
        if (error) throw new Error(error.message)
        return String(data)
      },
      async revokeInvite(code) {
        const { error } = await sb.rpc('admin_revoke_invite', { invite_code: code })
        if (error) throw new Error(error.message)
      },
      async updateProfile(userId, name, username) {
        const { error } = await sb.rpc('admin_update_profile', { target: userId, new_name: name, new_username: username })
        if (error) throw new Error(error.message)
      },
    },

    invites: {
      async mine() {
        return check(await sb.rpc('my_invite')) as { code: string; uses: number }
      },
      async renew() {
        return check(await sb.rpc('my_invite_renew')) as { code: string; uses: number }
      },
    },

    account: {
      async exportData() {
        return check(await sb.rpc('export_my_data')) as Record<string, unknown>
      },
      async deleteAccount() {
        await invoke('account-delete', { confirm: 'EXCLUIR' })
        await sb.auth.signOut()
      },
    },

    alerts: {
      async states() {
        const { data: s } = await sb.auth.getSession()
        if (!s.session) return {}
        const rows = check(await sb.from('alert_state').select('spot_id, state')) as Row[]
        return Object.fromEntries(rows.map((r) => [str(r.spot_id), { ...EMPTY_ALERT, ...(r.state as Partial<AlertState>) }]))
      },
    },

    whatsapp: {
      async status() {
        const { data: s } = await sb.auth.getSession()
        if (!s.session) return { phone: null, enabled: false, optedOut: false }
        const r = (check(await sb.from('whatsapp_contacts').select('phone, enabled, opted_out_at').maybeSingle()) ?? null) as Row | null
        return r ? { phone: str(r.phone), enabled: Boolean(r.enabled), optedOut: Boolean(r.opted_out_at) } : { phone: null, enabled: false, optedOut: false }
      },
      async start(phone) {
        return invoke<{ phone: string; dryRunCode?: string }>('whatsapp-link', { action: 'start', phone })
      },
      async verify(code) {
        return invoke<{ phone: string }>('whatsapp-link', { action: 'verify', code })
      },
      async setEnabled(on) {
        const id = await uidOrThrow()
        check(await sb.from('whatsapp_contacts').update({ enabled: on }).eq('user_id', id))
      },
      async unlink() {
        await invoke('whatsapp-link', { action: 'unlink' })
      },
    },

    push: {
      vapidPublicKey: (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || null,
      async subscribe(sub) {
        const id = await uidOrThrow()
        check(
          await sb.from('push_subscriptions').upsert({
            endpoint: sub.endpoint,
            user_id: id,
            p256dh: sub.keys?.p256dh,
            auth: sub.keys?.auth,
          }),
        )
      },
      async unsubscribe(endpoint) {
        check(await sb.from('push_subscriptions').delete().eq('endpoint', endpoint))
      },
      async test() {
        const r = await invoke<{ sent: number }>('push-test', {})
        return r.sent
      },
    },

    photos: {
      async listSessions({ spotId, date }) {
        let q = sb
          .from('photo_sessions_v')
          .select('*')
          .gt('photo_count', 0)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(60)
        if (spotId) q = q.eq('spot_id', spotId)
        if (date) q = q.eq('date', date)
        return (check(await q) as Row[]).map(toSession)
      },
      async getSession(id) {
        const s = check(await sb.from('photo_sessions_v').select('*').eq('id', id).maybeSingle()) as Row | null
        if (!s) return null
        const photos = check(
          await sb
            .from('photos')
            .select('id, session_id, preview_path, width, height')
            .eq('session_id', id)
            .order('created_at'),
        ) as Row[]
        return { session: toSession(s), photos: photos.map(toPhoto) }
      },
      async mySessions() {
        const id = await uidOrThrow()
        const rows = check(
          await sb.from('photo_sessions_v').select('*').eq('photographer_id', id).order('date', { ascending: false }),
        ) as Row[]
        return rows.map(toSession)
      },
      async createSession(input) {
        await uidOrThrow()
        const row = check(
          await sb
            .from('photo_sessions')
            .insert({
              spot_id: input.spotId,
              date: input.date,
              period: input.period,
              title: input.title,
              price_cents: input.priceCents,
            })
            .select('id')
            .single(),
        ) as Row
        const full = check(await sb.from('photo_sessions_v').select('*').eq('id', row.id).single()) as Row
        return toSession(full)
      },
      async uploadPhoto(sessionId, original, preview, size) {
        const uid = await uidOrThrow()
        const id = crypto.randomUUID()
        const ext = (original.name.split('.').pop() || 'jpg').toLowerCase()
        const originalPath = `${uid}/${sessionId}/${id}.${ext}`
        const previewPath = `${uid}/${sessionId}/${id}.jpg`
        check(await sb.storage.from('originals').upload(originalPath, original, { contentType: original.type }))
        check(await sb.storage.from('previews').upload(previewPath, preview, { contentType: 'image/jpeg' }))
        const row = check(
          await sb
            .from('photos')
            .insert({
              id,
              session_id: sessionId,
              preview_path: previewPath,
              original_path: originalPath,
              width: size.width,
              height: size.height,
            })
            .select('id, session_id, preview_path, width, height')
            .single(),
        ) as Row
        return toPhoto(row)
      },
      async checkout(sessionId, photoIds) {
        await uidOrThrow()
        const res = await invoke<{ url: string }>('create-checkout', { sessionId, photoIds })
        return { redirectUrl: res.url }
      },
      async myPurchases() {
        const uid = await uidOrThrow()
        const orders = check(
          await sb
            .from('orders')
            .select('id, session_id, total_cents, status, created_at, order_items(photo_id, photos(id, session_id, preview_path, width, height))')
            .eq('buyer_id', uid)
            .order('created_at', { ascending: false }),
        ) as Row[]
        const ids = [...new Set(orders.map((o) => str(o.session_id)))]
        const sessions = ids.length
          ? ((check(await sb.from('photo_sessions_v').select('*').in('id', ids)) as Row[]).map(toSession))
          : []
        return orders.flatMap((o): Purchase[] => {
          const session = sessions.find((s) => s.id === o.session_id)
          if (!session) return []
          const items = (o.order_items as { photos: Row | null }[]) ?? []
          return [
            {
              id: str(o.id),
              session,
              photos: items.flatMap((i) => (i.photos ? [toPhoto(i.photos)] : [])),
              totalCents: Number(o.total_cents),
              status: o.status as Purchase['status'],
              createdAt: str(o.created_at),
            },
          ]
        })
      },
      async downloadUrl(photoId) {
        const row = check(await sb.from('photos').select('original_path').eq('id', photoId).single()) as Row
        // A política de Storage só libera o original para quem comprou (ou para o próprio fotógrafo).
        const res = check(
          await sb.storage.from('originals').createSignedUrl(str(row.original_path), 600, { download: true }),
        ) as { signedUrl: string }
        return res.signedUrl
      },
      async connectPaymentsUrl() {
        const res = await invoke<{ url: string }>('mp-oauth', { action: 'start' })
        return res.url
      },
    },
  }
}
