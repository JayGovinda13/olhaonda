// Conecta a conta Mercado Pago do fotógrafo (OAuth de marketplace).
//  POST {action:'start'}  (logado)  -> { url } para autorizar no Mercado Pago
//  GET  ?code&state       (callback) -> troca o code por tokens e volta para o site
// Publicar com:  supabase functions deploy mp-oauth --no-verify-jwt
import { admin, env, handle, HttpError, json, mpOAuth, requireUser } from '../_shared/util.ts'

const redirectUri = () => `${env('SUPABASE_URL')}/functions/v1/mp-oauth`

Deno.serve(
  handle(async (req) => {
    const db = admin()

    if (req.method === 'POST') {
      const user = await requireUser(req)
      const { data: profile } = await db.from('profiles').select('is_photographer').eq('id', user.id).single()
      if (!profile?.is_photographer) throw new HttpError(403, 'Ative seu perfil de fotógrafo primeiro.')

      const state = crypto.randomUUID()
      await db.from('oauth_states').insert({ state, user_id: user.id, return_url: `${env('SITE_URL')}/fotos/vender` })
      const url = new URL('https://auth.mercadopago.com.br/authorization')
      url.searchParams.set('client_id', env('MP_CLIENT_ID'))
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('platform_id', 'mp')
      url.searchParams.set('state', state)
      url.searchParams.set('redirect_uri', redirectUri())
      return json({ url: url.toString() })
    }

    // Callback do Mercado Pago
    const params = new URL(req.url).searchParams
    const code = params.get('code')
    const state = params.get('state')
    if (!code || !state) throw new HttpError(400, 'Parâmetros ausentes')

    const { data: st } = await db.from('oauth_states').delete().eq('state', state).select('*').maybeSingle()
    if (!st || Date.now() - new Date(st.created_at).getTime() > 15 * 60_000) {
      throw new HttpError(400, 'Link de autorização expirado. Tente de novo.')
    }

    const t = await mpOAuth({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() })
    await db.from('mp_accounts').upsert({
      photographer_id: st.user_id,
      mp_user_id: String(t.user_id),
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    await db.from('profiles').update({ payments_connected: true }).eq('id', st.user_id)

    return Response.redirect(`${st.return_url}?mp=connected`, 302)
  }),
)
