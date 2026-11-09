/** Tipos de domínio compartilhados pelo backend real (Supabase) e pelo modo demonstração. */

export type Profile = {
  id: string
  name: string
  avatarUrl?: string | null
  isPhotographer: boolean
  /** Fotógrafo já conectou a conta Mercado Pago (recebe direto, com split). */
  paymentsConnected?: boolean
  instagram?: string | null
}

export const FORUM_CATEGORIES = [
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
}

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
export type NewSession = { spotId: string; date: string; period: Period; title: string | null; priceCents: number }

export interface Backend {
  readonly mode: 'demo' | 'supabase'

  auth: {
    current(): Promise<Profile | null>
    onChange(cb: (p: Profile | null) => void): () => void
    signInWithEmail(email: string): Promise<void>
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
