/**
 * Backend real: Supabase (Auth + Postgres com RLS + Storage + Edge Functions).
 * Esquema em supabase/migrations; pagamentos em supabase/functions.
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Backend, ForumCategory, Photo, PhotoSession, Post, Profile, Purchase, Thread } from './types'

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
    createdAt: str(r.created_at),
    lastActivityAt: str(r.last_activity_at),
    replyCount: Number(r.reply_count ?? 0),
  }
}

function toPost(r: Row): Post {
  return {
    id: str(r.id),
    threadId: str(r.thread_id),
    body: str(r.body),
    authorId: str(r.author_id),
    authorName: str(r.author_name),
    createdAt: str(r.created_at),
  }
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const sb: SupabaseClient = createClient(url, anonKey)
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
    }
  }

  async function uidOrThrow() {
    const { data } = await sb.auth.getUser()
    if (!data.user) throw new Error('Entre na sua conta para continuar.')
    return data.user.id
  }

  function check<T>(res: { data: T; error: { message: string } | null }) {
    if (res.error) throw new Error(res.error.message)
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
      async deletePost(postId) {
        check(await sb.from('forum_posts').delete().eq('id', postId))
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
