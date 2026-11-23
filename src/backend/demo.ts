/**
 * Modo demonstração: tudo fica no localStorage deste navegador.
 * Usado quando VITE_SUPABASE_URL não está configurado, para navegar e testar as telas.
 */
import type { AlertState } from '../../supabase/functions/_shared/core/alerts.ts'
import { extractMentions } from '../lib/mentions'
import { USERNAME_RE } from './types'
import type {
  AdminOverview,
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
  /** ciclo de aviso por usuário e pico (o que a Edge Function guarda em alert_state) */
  alertStates?: Record<string, Record<string, AlertState>>
  /** WhatsApp "ligado" por usuário (simulado: nenhuma mensagem sai do navegador) */
  whatsapp?: Record<string, { phone: string; enabled: boolean }>
  /** liberação por usuário e registro de quem liberou/bloqueou (tela de administração) */
  approvedAt?: Record<string, string>
  /** conta que pediu "esqueci a senha" (na demonstração não há e-mail: o link abre a tela direto) */
  recoveryFor?: string
  audit?: AdminOverview['audit']
  invites?: (AdminOverview['invites'][number] & { owner?: string })[]
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
      authorUsername: 'rafa.bodyboard',
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
      authorUsername: 'ana.lima',
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
      authorUsername: 'leo',
      createdAt: iso(60 * 72),
      lastActivityAt: iso(60 * 72),
      replyCount: 0,
      kind: 'user',
      forecastDate: null,
    },
  ]
  const posts: Post[] = [
    { id: 'p1', threadId: t1, body: 'Guaiúba estava menor mas bem formada na direita do canto.', authorId: 'u-ana', authorName: 'Ana Lima', authorUsername: 'ana.lima', createdAt: iso(120) },
    { id: 'p2', threadId: t1, body: 'Amanhã o modelo mostra 12 s de período, deve ficar ainda melhor.', authorId: 'u-leo', authorName: 'Léo', authorUsername: 'leo', createdAt: iso(40) },
    { id: 'p3', threadId: t2, body: 'Fish funciona bem lá até meio metro. Acima disso vai de prancha normal.', authorId: 'u-rafa', authorName: 'Rafa Bodyboard', authorUsername: 'rafa.bodyboard', createdAt: iso(60 * 20) },
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
function dropAlertState(userId: string, spotId: string) {
  const mine = { ...(db.alertStates?.[userId] ?? {}) }
  delete mine[spotId]
  db.alertStates = { ...(db.alertStates ?? {}), [userId]: mine }
}
let demoWaPending: { phone: string; code: string } | null = null
const emitNotif = () => notifListeners.forEach((l) => l())
/** marcou @alguém: a pessoa (se tiver conta neste navegador) recebe um aviso, como o servidor faz no Supabase */
function notifyMentions(author: Profile, text: string, threadTitle: string, threadId: string) {
  for (const handle of extractMentions(text)) {
    const target = db.users.find((u) => u.profile.username === handle && u.profile.id !== author.id)
    if (!target) continue
    const n: AppNotification = {
      id: uid(),
      spotId: 'forum',
      kind: 'mention',
      sessionDate: today(),
      title: `${author.name} te marcou no fórum`,
      body: `${threadTitle.slice(0, 80)}: ${text.slice(0, 140)}`,
      url: `/forum/${threadId}`,
      createdAt: iso(),
      readAt: null,
    }
    db.notifications[target.profile.id] = [n, ...(db.notifications[target.profile.id] ?? [])].slice(0, 100)
  }
  emitNotif()
}

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
      setMe({ id: `u-${email}`, name: email.split('@')[0], isPhotographer: false, approved: true, isAdmin: true })
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
        email,
        hasPassword: true,
        name: input.name.trim(),
        username,
        city: input.city.trim() || null,
        modality: input.modality,
        level: input.level,
        isPhotographer: false,
        approved: true,
        isAdmin: true,
      }
      const used = (db.invites ?? []).find((i) => i.code === input.invite)
      if (used) used.uses += 1
      db.users.push({ profile, email, password: input.password })
      setMe(profile)
      return { needsConfirmation: false }
    },
    async inviteValid(code) {
      // no demonstração qualquer código vale, a não ser que seja um convite criado aqui e já esgotado/revogado
      const inv = (db.invites ?? []).find((i) => i.code === code)
      return delay(!!code.trim() && (!inv || (!inv.revoked && (inv.maxUses == null || inv.uses < inv.maxUses))))
    },
    async usernameAvailable(username) {
      const u = username.trim().toLowerCase()
      return delay(USERNAME_RE.test(u) && !db.users.some((x) => x.profile.username === u))
    },
    async requestPasswordReset(email) {
      const u = db.users.find((x) => x.email === email.trim().toLowerCase())
      if (!u) return {}
      db.recoveryFor = u.profile.id
      save()
      return { demoLink: '/redefinir-senha' }
    },
    recoveryActive: () => Boolean(db.recoveryFor),
    onRecovery: () => () => {},
    async setNewPassword(next) {
      const u = db.users.find((x) => x.profile.id === db.recoveryFor)
      if (!u) throw new Error('Este link não vale mais. Peça um novo em "Esqueci minha senha".')
      if (next.length < 8) throw new Error('A nova senha precisa ter pelo menos 8 caracteres.')
      u.password = next
      db.recoveryFor = undefined
      setMe(u.profile)
    },
    async changePassword(current, next) {
      const me = requireMe()
      const u = db.users.find((x) => x.profile.id === me.id)
      if (!u || u.password !== current) throw new Error('Senha atual incorreta.')
      if (next.length < 8) throw new Error('A nova senha precisa ter pelo menos 8 caracteres.')
      if (next === current) throw new Error('A nova senha precisa ser diferente da atual.')
      u.password = next
      save()
    },
    async updateProfile(patch) {
      const me = requireMe()
      const next = { ...me, ...patch }
      const u = db.users.find((x) => x.profile.id === me.id)
      if (u) u.profile = next
      setMe(next)
    },
    async signInWithGoogle() {
      setMe({ id: 'u-google', name: 'Surfista', isPhotographer: false, approved: true, isAdmin: true })
    },
    async signInDemo(name, isPhotographer) {
      setMe({ id: `u-${name.toLowerCase().replace(/\W+/g, '-')}`, name, isPhotographer, paymentsConnected: isPhotographer, approved: true, isAdmin: true })
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
        authorUsername: me.username ?? null,
        createdAt: iso(),
        lastActivityAt: iso(),
        replyCount: 0,
        kind: 'user',
        forecastDate: null,
      }
      db.threads.unshift(t)
      notifyMentions(me, `${t.title}: ${t.body}`, t.title, t.id)
      save()
      return delay(t)
    },
    async reply(threadId, body) {
      const me = requireMe()
      const p: Post = { id: uid(), threadId, body, authorId: me.id, authorName: me.name, authorUsername: me.username ?? null, createdAt: iso() }
      db.posts.push(p)
      const t = db.threads.find((x) => x.id === threadId)
      notifyMentions(me, body, t?.title ?? '', threadId)
      if (t) {
        t.replyCount++
        t.lastActivityAt = p.createdAt
      }
      save()
      return delay(p)
    },
    async searchMembers(query) {
      const q = query.toLowerCase()
      const people = [
        { username: 'rafa.bodyboard', name: 'Rafa Bodyboard' },
        { username: 'ana.lima', name: 'Ana Lima' },
        { username: 'leo', name: 'Léo' },
        ...db.users.filter((u) => u.profile.username).map((u) => ({ username: u.profile.username as string, name: u.profile.name })),
      ]
      return delay(people.filter((p) => p.username !== db.me?.username && (!q || p.username.startsWith(q) || p.name.toLowerCase().includes(q))).slice(0, 6))
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
      // mudou o gosto ou ligou/desligou o aviso: o ciclo recomeça (o banco faz o mesmo por trigger)
      if (!prev || JSON.stringify(prev.prefs) !== JSON.stringify(prefs) || prev.notify !== notify) dropAlertState(me.id, spotId)
      db.favorites[me.id] = [...list.filter((f) => f.spotId !== spotId), fav]
      save()
      return delay(fav)
    },
    async remove(spotId) {
      const me = requireMe()
      db.favorites[me.id] = (db.favorites[me.id] ?? []).filter((f) => f.spotId !== spotId)
      dropAlertState(me.id, spotId)
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
      const dup = input.eventSeq != null ? (n: AppNotification) => n.spotId === input.spotId && n.eventSeq === input.eventSeq : (n: AppNotification) => n.spotId === input.spotId && n.sessionDate === input.sessionDate && n.kind === input.kind
      if (list.some(dup)) return null
      const n: AppNotification = { ...input, id: uid(), createdAt: iso(), readAt: null }
      db.notifications[me.id] = [n, ...list].slice(0, 100)
      save()
      emitNotif()
      return n
    },
  },

  admin: {
    // no modo demonstração não há bloqueio: a tela só mostra as contas criadas neste navegador
    async overview(): Promise<AdminOverview> {
      const users = db.users.map((u) => ({
        id: u.profile.id,
        name: u.profile.name,
        username: u.profile.username ?? null,
        email: u.email,
        city: u.profile.city ?? null,
        createdAt: iso(),
        emailConfirmed: true,
        approvedAt: db.approvedAt?.[u.profile.id] ?? iso(),
        role: 'user' as const,
      }))
      const counts: Record<string, number> = {}
      for (const list of Object.values(db.favorites)) for (const f of list) counts[f.spotId] = (counts[f.spotId] ?? 0) + 1
      const topSpots = Object.entries(counts).map(([spotId, count]) => ({ spotId, count })).sort((a, b) => b.count - a.count).slice(0, 20)
      return delay({ inviteOnly: true, limit: null, members: users.filter((u) => u.approvedAt).length, users, invites: (db.invites ?? []).filter((i) => !i.owner), topSpots, audit: db.audit ?? [] })
    },
    async createInvite({ label, maxUses, validDays }) {
      requireMe()
      const code = uid().replace(/-/g, '').padEnd(20, 'a').slice(0, 20)
      const inv = { code, label: label?.trim() || null, createdAt: iso(), expiresAt: validDays ? new Date(Date.now() + validDays * 864e5).toISOString() : null, maxUses: maxUses ?? null, uses: 0, revoked: false }
      db.invites = [inv, ...(db.invites ?? [])]
      return delay(code)
    },
    async revokeInvite(code) {
      db.invites = (db.invites ?? []).map((i) => (i.code === code ? { ...i, revoked: true } : i))
      return delay(undefined)
    },
    async updateProfile(userId, name, username) {
      const me = requireMe()
      const u = db.users.find((x) => x.profile.id === userId)
      if (!u) throw new Error('Pessoa não encontrada.')
      const nm = name.trim()
      if (nm.length < 1 || nm.length > 60) throw new Error('O nome precisa ter de 1 a 60 caracteres.')
      const un = username?.trim().toLowerCase() || null
      if (un && !USERNAME_RE.test(un)) throw new Error('Apelido: de 3 a 24 letras minúsculas, números, ponto ou sublinhado.')
      if (un && db.users.some((x) => x.profile.id !== userId && x.profile.username === un)) throw new Error('Esse apelido já está em uso.')
      u.profile = { ...u.profile, name: nm, username: un }
      if (db.me?.id === userId) setMe(u.profile)
      db.audit = [{ at: iso(), action: 'editou' as const, admin: me.name, target: nm }, ...(db.audit ?? [])].slice(0, 20)
      save()
    },
    async setAccess(userId, allow) {
      const me = requireMe()
      db.approvedAt = { ...(db.approvedAt ?? {}) }
      if (allow) db.approvedAt[userId] = iso()
      else delete db.approvedAt[userId]
      const target = db.users.find((u) => u.profile.id === userId)?.profile.name ?? null
      db.audit = [{ at: iso(), action: allow ? ('liberou' as const) : ('bloqueou' as const), admin: me.name, target }, ...(db.audit ?? [])].slice(0, 20)
      save()
    },
  },

  invites: {
    async mine() {
      const me = requireMe()
      let inv = (db.invites ?? []).find((i) => i.owner === me.id && !i.revoked)
      if (!inv) {
        inv = { code: uid().replace(/-/g, '').slice(0, 20), label: null, createdAt: iso(), expiresAt: null, maxUses: 10, uses: 0, revoked: false, owner: me.id }
        db.invites = [...(db.invites ?? []), inv]
      }
      return delay({ code: inv.code, uses: inv.uses, maxUses: inv.maxUses ?? 10 })
    },
    async renew() {
      const me = requireMe()
      db.invites = (db.invites ?? []).map((i) => (i.owner === me.id ? { ...i, revoked: true } : i))
      return demoBackend.invites.mine()
    },
  },

  account: {
    async exportData() {
      const me = requireMe()
      return delay({
        geradoEm: iso(),
        perfil: me,
        picosFavoritos: db.favorites[me.id] ?? [],
        avisosRecebidos: db.notifications[me.id] ?? [],
        topicosNoForum: db.threads.filter((t) => t.authorId === me.id),
        respostasNoForum: db.posts.filter((p) => p.authorId === me.id),
      })
    },
    async deleteAccount() {
      const me = requireMe()
      db.users = db.users.filter((u) => u.profile.id !== me.id)
      delete db.favorites[me.id]
      delete db.notifications[me.id]
      db.threads = db.threads.filter((t) => t.authorId !== me.id)
      db.posts = db.posts.filter((p) => p.authorId !== me.id)
      setMe(null)
    },
  },

  alerts: {
    async states() {
      if (!db.me) return {}
      return delay({ ...(db.alertStates?.[db.me.id] ?? {}) })
    },
    async saveState(spotId, state) {
      const me = requireMe()
      db.alertStates = { ...(db.alertStates ?? {}), [me.id]: { ...(db.alertStates?.[me.id] ?? {}), [spotId]: state } }
      save()
    },
  },

  whatsapp: {
    async status() {
      const w = db.me ? db.whatsapp?.[db.me.id] : undefined
      return delay(w ? { phone: w.phone, enabled: w.enabled, optedOut: false } : { phone: null, enabled: false, optedOut: false })
    },
    async start(phone) {
      requireMe()
      const digits = phone.replace(/\D/g, '')
      const full = digits.startsWith('55') ? digits : `55${digits}`
      if (!/^55[1-9][0-9][2-9][0-9]{7,8}$/.test(full)) throw new Error('Número inválido. Use o DDD e o número, por exemplo 11 99999-1234.')
      demoWaPending = { phone: `+${full}`, code: String(Math.floor(100000 + Math.random() * 900000)) }
      // demonstração: nada é enviado; o código aparece na tela
      return delay({ phone: demoWaPending.phone, dryRunCode: demoWaPending.code })
    },
    async verify(code) {
      const me = requireMe()
      if (!demoWaPending || code.replace(/\D/g, '') !== demoWaPending.code) throw new Error('Código incorreto.')
      db.whatsapp = { ...(db.whatsapp ?? {}), [me.id]: { phone: demoWaPending.phone, enabled: true } }
      const phone = demoWaPending.phone
      demoWaPending = null
      save()
      return delay({ phone })
    },
    async setEnabled(on) {
      const me = requireMe()
      const w = db.whatsapp?.[me.id]
      if (w) db.whatsapp = { ...db.whatsapp, [me.id]: { ...w, enabled: on } }
      save()
    },
    async unlink() {
      const me = requireMe()
      const rest = { ...(db.whatsapp ?? {}) }
      delete rest[me.id]
      db.whatsapp = rest
      save()
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
