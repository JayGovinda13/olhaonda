/** Tipos de domínio compartilhados pelo backend real (Supabase) e pelo modo demonstração. */
import type { SpotPrefs } from '../../supabase/functions/_shared/core/prefs.ts'
import type { DailySummary } from '../../supabase/functions/_shared/core/summary.ts'

export type Modality = 'surf' | 'bodyboard' | 'ambos'
export type Level = 'iniciante' | 'intermediario' | 'avancado'
export const MODALITY_LABEL: Record<Modality, string> = { surf: 'Surf', bodyboard: 'Bodyboard', ambos: 'Surf e bodyboard' }
export const LEVEL_LABEL: Record<Level, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' }
/** apelido: 3 a 24 caracteres, letras minúsculas, números, ponto e sublinhado */
export const USERNAME_RE = /^[a-z0-9_.]{3,24}$/

export type Profile = {
  id: string
  name: string
  avatarUrl?: string | null
  isPhotographer: boolean
  /** Fotógrafo já conectou a conta Mercado Pago (recebe direto, com split). */
  paymentsConnected?: boolean
  instagram?: string | null
  username?: string | null
  city?: string | null
  modality?: Modality | null
  level?: Level | null
  bio?: string | null
}

export type SignUpInput = {
  name: string
  username: string
  email: string
  password: string
  city: string
  modality: Modality
  level: Level
}

export type ProfilePatch = Partial<Pick<Profile, 'name' | 'username' | 'city' | 'modality' | 'level' | 'bio'>>

export const FORUM_CATEGORIES = [
  { id: 'previsao', label: 'Previsão do dia' },
  { id: 'condicoes', label: 'Condições do mar' },
  { id: 'picos', label: 'Picos e localismo' },
  { id: 'equipamento', label: 'Pranchas e equipamento' },
  { id: 'viagens', label: 'Trips e viagens' },
  { id: 'classificados', label: 'Classificados' },
  { id: 'geral', label: 'Papo geral' },
] as const

export type ForumCategory = (typeof FORUM_CATEGORIES)[number]['id']

export type Thread = {
  id: string
  title: string
  body: string
  category: ForumCategory
  spotId: string | null
  authorId: string
  authorName: string
  createdAt: string
  lastActivityAt: string
  replyCount: number
  /** user = tópico de pessoa; daily = resumo diário publicado pelo OlhaOnda */
  kind: 'user' | 'daily'
  forecastDate: string | null
}

/** categorias que pessoas podem escolher (a "previsao" é só do OlhaOnda) */
export const USER_CATEGORIES = FORUM_CATEGORIES.filter((c) => c.id !== 'previsao')

export type Favorite = { spotId: string; prefs: SpotPrefs; notify: boolean; createdAt: string }

export type AppNotification = {
  id: string
  spotId: string
  sessionDate: string
  title: string
  body: string
  /** caminho no site, ex.: /pico/gua-tombo-palanque?t=2026-11-12T06:00 */
  url: string
  createdAt: string
  readAt: string | null
}

export type NewNotification = Omit<AppNotification, 'id' | 'createdAt' | 'readAt'>

export type Post = {
  id: string
  threadId: string
  body: string
  authorId: string
  authorName: string
  createdAt: string
}

export type Period = 'manha' | 'tarde'

export type PhotoSession = {
  id: string
  photographerId: string
  photographerName: string
  spotId: string
  date: string // YYYY-MM-DD
  period: Period
  title: string | null
  priceCents: number
  coverUrl: string | null
  photoCount: number
  createdAt: string
}

export type Photo = {
  id: string
  sessionId: string
  previewUrl: string
  width: number
  height: number
}

export type Purchase = {
  id: string
  session: PhotoSession
  photos: Photo[]
  totalCents: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
}

export type NewThread = { title: string; body: string; category: ForumCategory; spotId: string | null }
export type { DailySummary, SpotPrefs }
export type NewSession = { spotId: string; date: string; period: Period; title: string | null; priceCents: number }

export interface Backend {
  readonly mode: 'demo' | 'supabase'

  auth: {
    current(): Promise<Profile | null>
    onChange(cb: (p: Profile | null) => void): () => void
    signInWithEmail(email: string): Promise<void>
    signInWithPassword(email: string, password: string): Promise<void>
    /** Cria a conta. needsConfirmation = precisa confirmar o e-mail antes de entrar. */
    signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }>
    usernameAvailable(username: string): Promise<boolean>
    updateProfile(patch: ProfilePatch): Promise<void>
    signInWithGoogle(): Promise<void>
    /** Só no modo demonstração. */
    signInDemo?(name: string, isPhotographer: boolean): Promise<void>
    signOut(): Promise<void>
    becomePhotographer(instagram: string | null): Promise<void>
  }

  forum: {
    listThreads(filter: { category?: ForumCategory | null; spotId?: string | null }): Promise<Thread[]>
    getThread(id: string): Promise<{ thread: Thread; posts: Post[] } | null>
    createThread(input: NewThread): Promise<Thread>
    reply(threadId: string, body: string): Promise<Post>
    deletePost(postId: string): Promise<void>
    /**
     * Só no modo demonstração: publica o resumo do dia (no Supabase quem publica é a Edge Function
     * daily-forecast). Não duplica: um resumo por pico por dia.
     */
    ensureDailyPost?(spotId: string, summary: DailySummary): Promise<void>
  }

  favorites: {
    list(): Promise<Favorite[]>
    save(spotId: string, prefs: SpotPrefs, notify: boolean): Promise<Favorite>
    remove(spotId: string): Promise<void>
  }

  notifications: {
    list(): Promise<AppNotification[]>
    markRead(ids: string[] | 'all'): Promise<void>
    /** Avisa quando chegam/mudam notificações (realtime no Supabase, local na demonstração). */
    onChange(cb: () => void): () => void
    /** Só no modo demonstração: registra um aviso; devolve null se já existia para esse pico e dia. */
    add?(n: NewNotification): Promise<AppNotification | null>
  }

  push: {
    /** Chave pública VAPID do servidor; null = push pelo servidor indisponível (avisos locais). */
    readonly vapidPublicKey: string | null
    subscribe(sub: PushSubscriptionJSON): Promise<void>
    unsubscribe(endpoint: string): Promise<void>
    test(): Promise<number>
  }

  photos: {
    listSessions(filter: { spotId?: string | null; date?: string | null }): Promise<PhotoSession[]>
    getSession(id: string): Promise<{ session: PhotoSession; photos: Photo[] } | null>
    mySessions(): Promise<PhotoSession[]>
    createSession(input: NewSession): Promise<PhotoSession>
    /** Recebe o original e a prévia com marca d'água já gerada no navegador. */
    uploadPhoto(sessionId: string, original: File, preview: Blob, size: { width: number; height: number }): Promise<Photo>
    /** Cria o pedido e devolve a URL de pagamento (Mercado Pago Checkout Pro). */
    checkout(sessionId: string, photoIds: string[]): Promise<{ redirectUrl: string }>
    myPurchases(): Promise<Purchase[]>
    downloadUrl(photoId: string): Promise<string>
    /** URL de autorização OAuth do Mercado Pago para o fotógrafo receber direto. */
    connectPaymentsUrl(): Promise<string>
  }
}

export const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const PERIOD_LABEL: Record<Period, string> = { manha: 'Manhã', tarde: 'Tarde' }
