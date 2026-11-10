// Envia uma notificação de teste para o próprio usuário (botão "Testar" em Meus picos).
import { admin, handle, json, requireUser } from '../_shared/util.ts'
import { pushToUser } from '../_shared/push.ts'

Deno.serve(
  handle(async (req) => {
    const user = await requireUser(req)
    const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
    const sent = await pushToUser(admin(), user.id, {
      title: 'OlhaOnda',
      body: 'Notificações ligadas! Avisaremos quando a previsão bater com o seu gosto.',
      url: `${site}/meus-picos`,
      tag: 'teste',
    })
    return json({ sent })
  }),
)
