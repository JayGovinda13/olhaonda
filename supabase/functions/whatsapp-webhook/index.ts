// Webhook do WhatsApp Cloud API (Meta). Publicar com:  supabase functions deploy whatsapp-webhook --no-verify-jwt
//   GET  : verificação do endereço (hub.challenge) ao cadastrar o webhook no painel da Meta
//   POST : mensagens recebidas (PARAR / VOLTAR) e status das enviadas (entregue, lida, falha)
// Variáveis: WHATSAPP_VERIFY_TOKEN (você inventa e repete no painel) e WHATSAPP_APP_SECRET (assinatura).
import { admin, env } from '../_shared/util.ts'
import { phoneVariants, sendText } from '../_shared/whatsapp.ts'

const STOP = ['parar', 'pare', 'sair', 'stop', 'cancelar', 'descadastrar']
const START = ['voltar', 'ativar', 'quero', 'start', 'ligar']
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').trim()

async function validSignature(req: Request, raw: string) {
  const secret = Deno.env.get('WHATSAPP_APP_SECRET')
  if (!secret) return false // sem segredo configurado não aceitamos nada: qualquer um poderia desligar avisos dos outros
  const sig = req.headers.get('x-hub-signature-256')?.replace('sha256=', '')
  if (!sig) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)))
  const expected = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('')
  return expected.length === sig.length && expected === sig
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  if (req.method === 'GET') {
    const ok = url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === env('WHATSAPP_VERIFY_TOKEN')
    return ok ? new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 }) : new Response('forbidden', { status: 403 })
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  const raw = await req.text()
  if (!(await validSignature(req, raw))) return new Response('forbidden', { status: 403 })
  const sb = admin()
  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch {
    return new Response('bad request', { status: 400 })
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value ?? {}
      // status das mensagens que enviamos
      for (const st of v.statuses ?? []) {
        const status = st.status === 'delivered' || st.status === 'read' || st.status === 'failed' ? st.status : null
        if (status) await sb.from('whatsapp_messages').update({ status, error: st.errors?.[0]?.title ?? null }).eq('wa_message_id', st.id)
      }
      // mensagens que a pessoa mandou
      for (const m of v.messages ?? []) {
        if (m.type !== 'text') continue
        const word = norm(String(m.text?.body ?? ''))
        const isStop = STOP.includes(word)
        const isStart = START.includes(word)
        if (!isStop && !isStart) continue
        const { data: c } = await sb.from('whatsapp_contacts').select('user_id, phone').in('phone', phoneVariants(`+${m.from}`)).maybeSingle()
        if (!c) continue
        await sb.from('whatsapp_contacts').update({ enabled: isStart, opted_out_at: isStart ? null : new Date().toISOString() }).eq('user_id', c.user_id)
        await sendText(
          sb,
          c.user_id,
          c.phone,
          isStop ? 'Pronto, parei de mandar avisos do OlhaOnda por aqui. Para voltar a receber, responda VOLTAR.' : 'Avisos do OlhaOnda ligados de novo. Para parar, responda PARAR.',
        )
      }
    }
  }
  return new Response('ok', { status: 200 })
})
