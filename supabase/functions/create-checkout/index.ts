// Cria o pedido e a preferência do Mercado Pago Checkout Pro (Pix, cartão, boleto),
// cobrando em nome do fotógrafo e retendo a comissão da plataforma (marketplace_fee).
import { admin, env, handle, HttpError, json, mpFetch, requireUser, sellerToken } from '../_shared/util.ts'

const FEE_PERCENT = Number(Deno.env.get('PLATFORM_FEE_PERCENT') ?? '20')

Deno.serve(
  handle(async (req) => {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não suportado')
    const user = await requireUser(req)
    const { sessionId, photoIds } = (await req.json()) as { sessionId?: string; photoIds?: string[] }

    if (!sessionId || !Array.isArray(photoIds) || photoIds.length < 1 || photoIds.length > 100) {
      throw new HttpError(400, 'Selecione de 1 a 100 fotos.')
    }
    const ids = [...new Set(photoIds)]
    const db = admin()

    const { data: session } = await db.from('photo_sessions').select('*').eq('id', sessionId).maybeSingle()
    if (!session) throw new HttpError(404, 'Sessão não encontrada.')
    if (session.photographer_id === user.id) throw new HttpError(400, 'Você não pode comprar as próprias fotos.')

    const { data: photos } = await db.from('photos').select('id').eq('session_id', sessionId).in('id', ids)
    if (!photos || photos.length !== ids.length) throw new HttpError(400, 'Algumas fotos não pertencem a esta sessão.')

    const seller = await sellerToken(db, { photographer_id: session.photographer_id })
    if (!seller) throw new HttpError(409, 'Este fotógrafo ainda não ativou os pagamentos.')

    const total = session.price_cents * ids.length
    const fee = Math.round((total * FEE_PERCENT) / 100)

    const { data: order, error } = await db
      .from('orders')
      .insert({
        buyer_id: user.id,
        photographer_id: session.photographer_id,
        session_id: sessionId,
        total_cents: total,
        fee_cents: fee,
      })
      .select('id')
      .single()
    if (error) throw error
    const { error: itemsErr } = await db
      .from('order_items')
      .insert(ids.map((photo_id) => ({ order_id: order.id, photo_id, price_cents: session.price_cents })))
    if (itemsErr) throw itemsErr

    const site = env('SITE_URL')
    const back = `${site}/fotos/compras`
    const pref = await mpFetch<{ id: string; init_point: string }>('/checkout/preferences', seller.access_token, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': order.id },
      body: JSON.stringify({
        items: [
          {
            id: sessionId,
            title: `OlhaOnda · ${ids.length} foto(s) de surf`,
            quantity: ids.length,
            unit_price: session.price_cents / 100,
            currency_id: 'BRL',
          },
        ],
        payer: user.email ? { email: user.email } : undefined,
        marketplace_fee: fee / 100,
        external_reference: order.id,
        notification_url: `${env('SUPABASE_URL')}/functions/v1/mp-webhook`,
        back_urls: { success: back, pending: back, failure: back },
        auto_return: 'approved',
        statement_descriptor: 'OLHAONDA',
      }),
    })

    await db.from('orders').update({ mp_preference_id: pref.id }).eq('id', order.id)
    return json({ url: pref.init_point })
  }),
)
