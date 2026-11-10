/**
 * Modo demonstração: tudo fica no localStorage deste navegador.
 * Usado quando VITE_SUPABASE_URL não está configurado, para navegar e testar as telas.
 */
import { USERNAME_RE } from './types'
import type {
  AppNotification,
  Backend,
  Favorite,
  NewSession,
  NewThread,
  Photo,
  PhotoSession,
  Post,
  Profile,
  Purchase,
  Thread,
} from './types'

type DemoUser = { profile: Profile; email: string; password: string }

type DB = {
  me: Profile | null
  /** contas criadas no cadastro (só neste navegador) */
  users: DemoUser[]
  favorites: Record<string, Favorite[]>
  notifications: Record<string, AppNotification[]>
  threads: Thread[]
  posts: Post[]
  sessions: PhotoSession[]
  photos: Photo[]
  purchases: { id: string; sessionId: string; photoIds: string[]; totalCents: number; createdAt: string }[]
}

const KEY = 'olhaonda:demo:v2'
const uid = () => Math.random().toString(36).slice(2, 10)
const iso = (offsetMin = 0) => new Date(Date.now() - offsetMin * 60_000).toISOString()
const today = (offsetDays = 0) => {
  const d = new Date(Date.now() - 3 * 3600_000 - offsetDays * 86_400_000)
  return d.toISOString().slice(0, 10)
}

/** Foto fictícia em SVG (céu, mar e uma onda), já com marca d'água. */
function fakePhoto(seed: number, credit: string) {
  const hue = [158, 170, 190, 200, 145][seed % 5]
  const crest = 180 + (seed % 4) * 25
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5E6D3"/><stop offset="1" stop-color="hsl(${hue},45%,72%)"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,38%)"/><stop offset="1" stop-color="#0F4C3A"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#s)"/>
<path d="M0 ${crest + 250} C 250 ${crest + 120}, 420 ${crest}, 640 ${crest + 40} C 820 ${crest + 70}, 900 ${crest + 210}, 1200 ${crest + 230} L1200 800 L0 800Z" fill="url(#w)"/>
<path d="M560 ${crest + 30} C 640 ${crest - 10}, 720 ${crest + 20}, 760 ${crest + 90}" stroke="#F5E6D3" stroke-width="14" fill="none" stroke-linecap="round" opacity=".8"/>
<g transform="translate(${430 + (seed % 3) * 60} ${crest + 60}) rotate(-12)"><rect x="-70" y="-6" width="140" height="12" rx="6" fill="#F5E6D3"/><circle cx="0" cy="-34" r="12" fill="#4B1D5A"/><path d="M-6 -22 L-24 -2 M6 -22 L24 -2 M0 -22 L0 -6" stroke="#4B1D5A" stroke-width="9" stroke-linecap="round"/></g>
<g fill="#F5E6D3" fill-opacity=".38" font-family="sans-serif" font-weight="800" font-size="46" transform="rotate(-25 600 400)">
${[0, 1, 2, 3, 4, 5].map((r) => `<text x="${-200 + (r % 2) * 180}" y="${80 + r * 150}">OlhaOnda · ${credit}   OlhaOnda · ${credit}   OlhaOnda · ${credit}</text>`).join('')}
</g></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function seed(): DB {
  const t1 = 'seed-t1'
  const t2 = 'seed-t2'
  const t3 = 'seed-t3'
  const threads: Thread[] = [
    {
      id: t1,
      title: 'Tombo hoje cedo: séries de 1,5 m com terral',
      body: 'Entrou bem o swell de sul. Até umas 9h estava liso, depois o vento virou. Alguém foi na Guaiúba?',
      category: 'condicoes',
      spotId: 'gua-tombo-palanque',
      authorId: 'u-rafa',
      authorName: 'Rafa Bodyboard',
      createdAt: iso(180),
      lastActivityAt: iso(40),
      replyCount: 2,
      kind: 'user',
      forecastDate: null,
    },
    {
      id: t2,
      title: 'Prancha para Pitangueiras em dia pequeno?',
      body: 'Peso 78 kg e estou pensando num fish 5\'10". Vale para o beach break do Guarujá ou melhor um funboard?',
      category: 'equipamento',
      spotId: 'gua-pit-ilha',
      authorId: 'u-ana',
      authorName: 'Ana Lima',
      createdAt: iso(60 * 26),
      lastActivityAt: iso(60 * 20),
      replyCount: 1,
      kind: 'user',
      forecastDate: null,
    },
    {
      id: t3,
      title: 'Trip para Itacaré em dezembro, dicas?',
      body: 'Quero pegar a Tiririca e a Engenhoca. Melhor época de swell e onde ficar?',
      category: 'viagens',
      spotId: 'itacare',
      authorId: 'u-leo',
      authorName: 'Léo',
      createdAt: iso(60 * 72),
      lastActivityAt: iso(60 * 72),
      replyCount: 0,
      kind: 'user',
      forecastDate: null,
    },
  ]
  const posts: Post[] = [
    { id: 'p1', threadId: t1, body: 'Guaiúba estava menor mas bem formada na direita do canto.', authorId: 'u-ana', authorName: 'Ana Lima', createdAt: iso(120) },
    { id: 'p2', threadId: t1, body: 'Amanhã o modelo mostra 12 s de período, deve ficar ainda melhor.', authorId: 'u-leo', authorName: 'Léo', createdAt: iso(40) },
    { id: 'p3', threadId: t2, body: 'Fish funciona bem lá até meio metro. Acima disso vai de prancha normal.', authorId: 'u-rafa', authorName: 'Rafa Bodyboard', createdAt: iso(60 * 20) },
  ]
  const sessions: PhotoSession[] = []
  const photos: Photo[] = []
  const mk = (id: string, name: string, spotId: string, date: string, period: 'manha' | 'tarde', price: number, n: number) => {
    const ph: Photo[] = Array.from({ length: n }, (_, i) => ({
      id: `${id}-ph${i}`,
      sessionId: id,
      previewUrl: fakePhoto(i + id.length, name),
      width: 1200,
      height: 800,
    }))
    photos.push(...ph)
    sessions.push({
      id,
      photographerId: `ph-${name}`,
      photographerName: name,
      spotId,
      date,
      period,
      title: null,
      priceCents: price,
      coverUrl: ph[0].previewUrl,
      photoCount: n,
      createdAt: iso(),
    })
  }
  mk('s1', '@mar.lentes', 'gua-tombo-palanque', today(0), 'manha', 2500, 9)
  mk('s2', '@fotosurfguaruja', 'gua-pit-ilha', today(0), 'tarde', 2000, 6)
  mk('s3', '@mar.lentes', 'gua-guaiuba', today(1), 'manha', 2500, 8)
  mk('s4', '@ondaclick', 'maresias', today(2), 'manha', 3000, 7)
  return { me: null, users: [], favorites: {}, notifications: {}, threads, posts, sessions, photos, purchases: [] }
}

const seedEmpty = () => ({ users: [], favorites: {}, notifications: {} })

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...seedEmpty(), ...(JSON.parse(raw) as Partial<DB>) } as DB
  } catch {
    /* ignora */
  }
  return seed()
}

let db = load()
// Prévias enviadas nesta aba (object URLs não sobrevivem a um reload)
const blobUrls = new Map<string, string>()
const listeners = new Set<(p: Profile | null) => void>()
const notifListeners = new Set<() => void>()
const emitNotif = () => notifListeners.forEach((l) => l())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* storage cheio ou bloqueado */
  }
}
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150))
function requireMe() {
  if (!db.me) throw new Error('Entre na sua conta para continuar.')
  return db.me
}
function setMe(p: Profile | null) {
  db.me = p
  save()
  listeners.forEach((l) => l(p))
}

export const demoBackend: Backend = {
  mode: 'demo',

  auth: {
    current: () => delay(db.me),
    onChange(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    async signInWithEmail(email) {
      setMe({ id: `u-${email}`, name: email.split('@')[0], isPhotographer: false })
    },
    async signInWithPassword(email, password) {
      const u = db.users.find((x) => x.email === email.trim().toLowerCase())
      if (!u || u.password !== password) throw new Error('E-mail ou senha incorretos.')
      setMe(u.profile)
    },
    async signUp(input) {
      const email = input.email.trim().toLowerCase()
      if (db.users.some((u) => u.email === email)) throw new Error('Já existe uma conta com esse e-mail.')
      const username = input.username.trim().toLowerCase()
      if (!USERNAME_RE.test(username)) throw new Error('Apelido inválido.')
      if (db.users.some((u) => u.profile.username === username)) throw new Error('Esse apelido já está em uso.')
      const profile: Profile = {
        id: `u-${uid()}`,
        name: input.name.trim(),
        username,
        city: input.city.trim() || null,
        modality: input.modality,
        level: input.level,
        isPhotographer: false,
      }
      db.users.push({ profile, email, password: input.password })
      setMe(profile)
      return { needsConfirmation: false }
    },
    async usernameAvailable(username) {
      const u = username.trim().toLowerCase()
      return delay(USERNAME_RE.test(u) && !db.users.some((x) => x.profile.username === u))
    },
    async updateProfile(patch) {
      const me = requireMe()
      const next = { ...me, ...patch }
      const u = db.users.find((x) => x.profile.id === me.id)
      if (u) u.profile = next
      setMe(next)
    },
    async signInWithGoogle() {
      setMe({ id: 'u-google', name: 'Surfista', isPhotographer: false })
    },
    async signInDemo(name, isPhotographer) {
      setMe({ id: `u-${name.toLowerCase().replace(/\W+/g, '-')}`, name, isPhotographer, paymentsConnected: isPhotographer })
    },
    async signOut() {
      setMe(null)
    },
    async becomePhotographer(instagram) {
      const me = requireMe()
      setMe({ ...me, isPhotographer: true, instagram, paymentsConnected: true })
    },
  },

  forum: {
    async listThreads({ category, spotId }) {
      return delay(
        db.threads
          .filter((t) => (!category || t.category === category) && (!spotId || t.spotId === spotId))
          .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
      )
    },
    async getThread(id) {
      const thread = db.threads.find((t) => t.id === id)
      if (!thread) return delay(null)
      return delay({ thread, posts: db.posts.filter((p) => p.threadId === id) })
    },
    async createThread(input: NewThread) {
      const me = requireMe()
      const t: Thread = {
        ...input,
        id: uid(),
        authorId: me.id,
        authorName: me.name,
        createdAt: iso(),
        lastActivityAt: iso(),
        replyCount: 0,
        kind: 'user',
        forecastDate: null,
      }
      db.threads.unshift(t)
      save()
      return delay(t)
    },
    async reply(threadId, body) {
      const me = requireMe()
      const p: Post = { id: uid(), threadId, body, authorId: me.id, authorName: me.name, createdAt: iso() }
      db.posts.push(p)
      const t = db.threads.find((x) => x.id === threadId)
      if (t) {
        t.replyCount++
        t.lastActivityAt = p.createdAt
      }
      save()
      return delay(p)
    },
    async deletePost(postId) {
      const me = requireMe()
      const p = db.posts.find((x) => x.id === postId)
      if (!p || p.authorId !== me.id) throw new Error('Você só pode apagar suas mensagens.')
      db.posts = db.posts.filter((x) => x.id !== postId)
      const t = db.threads.find((x) => x.id === p.threadId)
      if (t) t.replyCount--
      save()
    },
    async ensureDailyPost(spotId, summary) {
      if (db.threads.some((t) => t.kind === 'daily' && t.spotId === spotId && t.forecastDate === summary.date)) return
      const at = `${summary.date}T08:15:00.000Z` // 05:15 em São Paulo, como a rodada do servidor
      db.threads.unshift({
        id: uid(),
        title: summary.title,
        body: summary.body,
        category: 'previsao',
        spotId,
        authorId: 'olhaonda',
        authorName: 'OlhaOnda',
        createdAt: at < iso() ? at : iso(),
        lastActivityAt: at < iso() ? at : iso(),
        replyCount: 0,
        kind: 'daily',
        forecastDate: summary.date,
      })
      save()
    },
  },

  favorites: {
    async list() {
      const me = requireMe()
      return delay(db.favorites[me.id] ?? [])
    },
    async save(spotId, prefs, notify) {
      const me = requireMe()
      const list = db.favorites[me.id] ?? []
      const prev = list.find((f) => f.spotId === spotId)
      const fav: Favorite = { spotId, prefs, notify, createdAt: prev?.createdAt ?? iso() }
      db.favorites[me.id] = [...list.filter((f) => f.spotId !== spotId), fav]
      save()
      return delay(fav)
    },
    async remove(spotId) {
      const me = requireMe()
      db.favorites[me.id] = (db.favorites[me.id] ?? []).filter((f) => f.spotId !== spotId)
      save()
    },
  },

  notifications: {
    async list() {
      if (!db.me) return []
      return delay([...(db.notifications[db.me.id] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    },
    async markRead(ids) {
      const me = requireMe()
      const now = iso()
      for (const n of db.notifications[me.id] ?? []) if (!n.readAt && (ids === 'all' || ids.includes(n.id))) n.readAt = now
      save()
      emitNotif()
    },
    onChange(cb) {
      notifListeners.add(cb)
      return () => notifListeners.delete(cb)
    },
    async add(input) {
      const me = requireMe()
      const list = db.notifications[me.id] ?? []
      if (list.some((n) => n.spotId === input.spotId && n.sessionDate === input.sessionDate)) return null
      const n: AppNotification = { ...input, id: uid(), createdAt: iso(), readAt: null }
      db.notifications[me.id] = [n, ...list].slice(0, 100)
      save()
      emitNotif()
      return n
    },
  },

  push: {
    vapidPublicKey: null, // demonstração: avisos locais do navegador, sem servidor de push
    async subscribe() {},
    async unsubscribe() {},
    async test() {
      return 0
    },
  },

  photos: {
    async listSessions({ spotId, date }) {
      return delay(
        db.sessions
          .filter((s) => s.photoCount > 0 && (!spotId || s.spotId === spotId) && (!date || s.date === date))
          .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
      )
    },
    async getSession(id) {
      const session = db.sessions.find((s) => s.id === id)
      if (!session) return delay(null)
      const photos = db.photos
        .filter((p) => p.sessionId === id)
        .map((p) => ({ ...p, previewUrl: blobUrls.get(p.id) ?? p.previewUrl }))
      return delay({ session: { ...session, coverUrl: photos[0]?.previewUrl ?? null }, photos })
    },
    async mySessions() {
      const me = requireMe()
      return delay(db.sessions.filter((s) => s.photographerId === me.id))
    },
    async createSession(input: NewSession) {
      const me = requireMe()
      if (!me.isPhotographer) throw new Error('Ative seu perfil de fotógrafo primeiro.')
      const s: PhotoSession = {
        ...input,
        id: uid(),
        photographerId: me.id,
        photographerName: me.instagram || me.name,
        coverUrl: null,
        photoCount: 0,
        createdAt: iso(),
      }
      db.sessions.unshift(s)
      save()
      return delay(s)
    },
    async uploadPhoto(sessionId, _original, preview, size) {
      const s = db.sessions.find((x) => x.id === sessionId)
      if (!s) throw new Error('Sessão não encontrada')
      const id = uid()
      const url = URL.createObjectURL(preview)
      blobUrls.set(id, url)
      // guardamos só um placeholder leve; a imagem real vive apenas nesta aba
      const p: Photo = { id, sessionId, previewUrl: fakePhoto(db.photos.length, s.photographerName), ...size }
      db.photos.push(p)
      s.photoCount++
      s.coverUrl = s.coverUrl ?? p.previewUrl
      save()
      return delay({ ...p, previewUrl: url })
    },
    async checkout(sessionId, photoIds) {
      requireMe()
      const s = db.sessions.find((x) => x.id === sessionId)
      if (!s) throw new Error('Sessão não encontrada')
      // Demonstração: o pagamento é aprovado na hora.
      db.purchases.unshift({ id: uid(), sessionId, photoIds, totalCents: s.priceCents * photoIds.length, createdAt: iso() })
      save()
      return delay({ redirectUrl: '/fotos/compras?status=approved' })
    },
    async myPurchases() {
      requireMe()
      const out: Purchase[] = db.purchases.flatMap((p) => {
        const session = db.sessions.find((s) => s.id === p.sessionId)
        if (!session) return []
        return [
          {
            id: p.id,
            session,
            photos: db.photos.filter((ph) => p.photoIds.includes(ph.id)),
            totalCents: p.totalCents,
            status: 'paid' as const,
            createdAt: p.createdAt,
          },
        ]
      })
      return delay(out)
    },
    async downloadUrl(photoId) {
      const p = db.photos.find((x) => x.id === photoId)
      if (!p) throw new Error('Foto não encontrada')
      return blobUrls.get(photoId) ?? p.previewUrl
    },
    async connectPaymentsUrl() {
      return '/fotos/vender?mp=connected'
    },
  },
}
