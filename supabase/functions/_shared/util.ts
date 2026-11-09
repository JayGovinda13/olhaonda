// Utilitários compartilhados pelas Edge Functions (Deno).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const env = (k: string) => {
  const v = Deno.env.get(k)
  if (!v) throw new Error(`Variável ${k} não configurada`)
  return v
}

const SITE_URL = Deno.env.get('SITE_URL') ?? '*'

export const cors = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

/** Cliente com service role: ignora RLS. Use só depois de validar o usuário. */
export const admin = (): SupabaseClient =>
  createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })

/** Usuário autenticado a partir do JWT enviado pelo app. */
export async function requireUser(req: Request) {
  const auth = req.headers.get('Authorization')
  if (!auth) throw new HttpError(401, 'Entre na sua conta para continuar.')
  const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  })
  const { data, error } = await sb.auth.getUser()
  if (error || !data.user) throw new HttpError(401, 'Sessão inválida. Entre novamente.')
  return data.user
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    try {
      return await fn(req)
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status)
      console.error(e)
      return json({ error: 'Erro interno. Tente de novo em instantes.' }, 500)
    }
  }
}

// --------------------------------------------------------------------------
// Mercado Pago
// --------------------------------------------------------------------------
const MP_API = 'https://api.mercadopago.com'

export async function mpFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Mercado Pago', path, res.status, body)
    throw new HttpError(502, 'O Mercado Pago recusou a operação.')
  }
  return body as T
}

type OAuthToken = { access_token: string; refresh_token: string; user_id: number; expires_in: number }

export async function mpOAuth(params: Record<string, string>): Promise<OAuthToken> {
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env('MP_CLIENT_ID'), client_secret: env('MP_CLIENT_SECRET'), ...params }),
  })
  const body = await res.json()
  if (!res.ok) {
    console.error('MP OAuth', res.status, body)
    throw new HttpError(502, 'Não foi possível conectar ao Mercado Pago.')
  }
  return body as OAuthToken
}

/** Token do vendedor (fotógrafo), renovado se estiver perto de expirar. */
export async function sellerToken(db: SupabaseClient, where: { photographer_id?: string; mp_user_id?: string }) {
  let q = db.from('mp_accounts').select('*')
  if (where.photographer_id) q = q.eq('photographer_id', where.photographer_id)
  if (where.mp_user_id) q = q.eq('mp_user_id', where.mp_user_id)
  const { data: acc } = await q.maybeSingle()
  if (!acc) return null

  const expiresSoon = acc.expires_at && new Date(acc.expires_at).getTime() < Date.now() + 7 * 86_400_000
  if (expiresSoon && acc.refresh_token) {
    const t = await mpOAuth({ grant_type: 'refresh_token', refresh_token: acc.refresh_token })
    await db
      .from('mp_accounts')
      .update({
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('photographer_id', acc.photographer_id)
    return { ...acc, access_token: t.access_token }
  }
  return acc as { photographer_id: string; access_token: string; mp_user_id: string }
}
