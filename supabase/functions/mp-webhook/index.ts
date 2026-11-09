// Notificações do Mercado Pago: confirma o pagamento e libera os originais.
// Publicar com:  supabase functions deploy mp-webhook --no-verify-jwt
import { admin, handle, json, mpFetch, sellerToken } from '../_shared/util.ts'

const SECRET = Deno.env.get('MP_WEBHOOK_SECRET')

async function hmacHex(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Valida o cabeçalho x-signature (ts=…,v1=…) conforme a documentação do Mercado Pago. */
async function validSignature(req: Request, dataId: string) {
  if (!SECRET) return true // sem segredo configurado (apenas em testes)
  const header = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]))
  if (!parts.ts || !parts.v1) return false
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`
  return (await hmacHex(SECRET, manifest)) === parts.v1
}

type Payment = { id: number; status: string; external_reference: string | null; transaction_amount: number }

Deno.serve(
  handle(async (req) => {
    const url = new URL(req.url)
    const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string }; user_id?: number }
    const type = body.type ?? url.searchParams.get('type')
    const dataId = String(body.data?.id ?? url.searchParams.get('data.id') ?? '')
    if (type !== 'payment' || !dataId) return json({ ok: true, ignored: true })
    if (!(await validSignature(req, dataId))) return json({ error: 'assinatura inválida' }, 401)

    const db = admin()
    // O pagamento pertence à conta do fotógrafo (vendedor); usamos o token dele para consultar.
    const seller = body.user_id ? await sellerToken(db, { mp_user_id: String(body.user_id) }) : null
    if (!seller) return json({ ok: true, ignored: 'vendedor desconhecido' })

    const pay = await mpFetch<Payment>(`/v1/payments/${dataId}`, seller.access_token)
    if (!pay.external_reference) return json({ ok: true })

    const { data: order } = await db.from('orders').select('*').eq('id', pay.external_reference).maybeSingle()
    if (!order || order.photographer_id !== seller.photographer_id) return json({ ok: true })

    if (pay.status === 'approved') {
      if (Math.round(pay.transaction_amount * 100) < order.total_cents) {
        console.error('valor divergente', pay.id, order.id)
        return json({ ok: true })
      }
      await db
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString(), mp_payment_id: String(pay.id) })
        .eq('id', order.id)
        .eq('status', 'pending')
    } else if (pay.status === 'rejected' || pay.status === 'cancelled') {
      await db.from('orders').update({ status: 'cancelled', mp_payment_id: String(pay.id) }).eq('id', order.id).eq('status', 'pending')
    } else if (pay.status === 'refunded' || pay.status === 'charged_back') {
      await db.from('orders').update({ status: 'refunded' }).eq('id', order.id)
    }
    return json({ ok: true })
  }),
)
