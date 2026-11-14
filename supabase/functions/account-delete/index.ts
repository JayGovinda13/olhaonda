// LGPD: a pessoa exclui a própria conta e os dados ligados a ela.
//   { confirm: 'EXCLUIR' }
// Apaga o login (auth.users); o perfil, favoritos, avisos, inscrições de push, WhatsApp, tópicos e respostas do fórum
// saem junto (on delete cascade). O registro de mensagens do WhatsApp é apagado antes, porque guarda o número.
import { admin, handle, HttpError, json, requireUser } from '../_shared/util.ts'

Deno.serve(
  handle(async (req) => {
    const user = await requireUser(req)
    const body = await req.json().catch(() => ({}))
    if (body.confirm !== 'EXCLUIR') throw new HttpError(400, 'Digite EXCLUIR para confirmar.')
    const sb = admin()

    const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (me?.role === 'admin') {
      const { count } = await sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
      if ((count ?? 0) <= 1) throw new HttpError(409, 'Você é o único administrador. Passe a administração para outra conta antes de excluir esta.')
    }

    await sb.from('whatsapp_messages').delete().eq('user_id', user.id)
    await sb.from('whatsapp_codes').delete().eq('user_id', user.id)
    const { error } = await sb.auth.admin.deleteUser(user.id)
    if (error) {
      console.error('deleteUser', error)
      throw new HttpError(500, 'Não foi possível excluir a conta agora. Tente de novo ou escreva para o e-mail de privacidade.')
    }
    return json({ ok: true })
  }),
)
