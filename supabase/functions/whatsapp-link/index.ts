// Liga o WhatsApp da pessoa à conta, com verificação por código.
//   { action: 'start',  phone }  envia um código de 6 dígitos pelo WhatsApp (vale 10 min)
//   { action: 'verify', code }   confere o código e liga o número (registra o consentimento)
//   { action: 'unlink' }         desliga e apaga o número
// O número só passa a valer depois de verificado: ninguém recebe aviso num número que não é seu.
import { admin, handle, HttpError, json, requireUser } from '../_shared/util.ts'
import { normalizeBrPhone, sendTemplate, whatsappConfigured, whatsappDryRun } from '../_shared/whatsapp.ts'

const CODE_TTL_MIN = 10
const MAX_ATTEMPTS = 5
const MAX_SENDS_PER_DAY = 5
const RESEND_WAIT_S = 60

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
const hashCode = (code: string, userId: string) => sha256(`${code}:${userId}:${Deno.env.get('CRON_SECRET') ?? 'olhaonda'}`)
const newCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0')

Deno.serve(
  handle(async (req) => {
    const user = await requireUser(req)
    const body = await req.json().catch(() => ({}))
    const sb = admin()

    if (body.action === 'start') {
      if (!whatsappConfigured() && !whatsappDryRun()) throw new HttpError(503, 'O WhatsApp ainda não está ativo neste ambiente.')
      const phone = normalizeBrPhone(String(body.phone ?? ''))
      if (!phone) throw new HttpError(400, 'Número inválido. Use o DDD e o número, por exemplo 11 99999-1234.')

      const { data: owner } = await sb.from('whatsapp_contacts').select('user_id').eq('phone', phone).maybeSingle()
      if (owner && owner.user_id !== user.id) throw new HttpError(409, 'Esse número já está ligado a outra conta.')

      const { data: prev } = await sb.from('whatsapp_codes').select('*').eq('user_id', user.id).maybeSingle()
      const today = new Date().toISOString().slice(0, 10)
      if (prev) {
        const wait = RESEND_WAIT_S - (Date.now() - new Date(prev.sent_at).getTime()) / 1000
        if (wait > 0) throw new HttpError(429, `Aguarde ${Math.ceil(wait)} segundos para pedir outro código.`)
        if (prev.sends_day === today && prev.sends_today >= MAX_SENDS_PER_DAY) throw new HttpError(429, 'Muitos códigos pedidos hoje. Tente amanhã.')
      }

      const code = newCode()
      const sends = prev && prev.sends_day === today ? prev.sends_today + 1 : 1
      const { error } = await sb.from('whatsapp_codes').upsert({
        user_id: user.id,
        phone,
        code_hash: await hashCode(code, user.id),
        expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
        attempts: 0,
        sent_at: new Date().toISOString(),
        sends_day: today,
        sends_today: sends,
      })
      if (error) throw error
      const sent = await sendTemplate(sb, user.id, phone, 'olhaonda_codigo', [code])
      if (sent.status === 'failed') throw new HttpError(502, 'Não foi possível enviar o código pelo WhatsApp. Confira o número e tente de novo.')
      // ambiente de teste sem credenciais: devolve o código para a tela (nunca em produção)
      return json({ ok: true, phone, expiresInMin: CODE_TTL_MIN, ...(sent.status === 'dry_run' ? { dryRunCode: code } : {}) })
    }

    if (body.action === 'verify') {
      const code = String(body.code ?? '').replace(/\D/g, '')
      const { data: row } = await sb.from('whatsapp_codes').select('*').eq('user_id', user.id).maybeSingle()
      if (!row) throw new HttpError(400, 'Peça um código primeiro.')
      if (new Date(row.expires_at).getTime() < Date.now()) throw new HttpError(400, 'O código venceu. Peça um novo.')
      if (row.attempts >= MAX_ATTEMPTS) throw new HttpError(429, 'Muitas tentativas. Peça um novo código.')
      if ((await hashCode(code, user.id)) !== row.code_hash) {
        await sb.from('whatsapp_codes').update({ attempts: row.attempts + 1 }).eq('user_id', user.id)
        throw new HttpError(400, 'Código incorreto.')
      }
      const now = new Date().toISOString()
      const { error } = await sb.from('whatsapp_contacts').upsert({ user_id: user.id, phone: row.phone, verified_at: now, consented_at: now, enabled: true, opted_out_at: null })
      if (error) {
        if (error.code === '23505') throw new HttpError(409, 'Esse número já está ligado a outra conta.')
        throw error
      }
      await sb.from('whatsapp_codes').delete().eq('user_id', user.id)
      await sendTemplate(sb, user.id, row.phone, 'olhaonda_boas_vindas', [])
      return json({ ok: true, phone: row.phone })
    }

    if (body.action === 'unlink') {
      await sb.from('whatsapp_contacts').delete().eq('user_id', user.id)
      await sb.from('whatsapp_codes').delete().eq('user_id', user.id)
      return json({ ok: true })
    }

    throw new HttpError(400, 'Ação inválida.')
  }),
)
