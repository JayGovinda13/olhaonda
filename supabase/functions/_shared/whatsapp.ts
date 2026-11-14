// WhatsApp Business Cloud API (Meta). Mensagens que NÓS iniciamos só podem ser "modelos" (templates) aprovados;
// os textos exatos estão em docs/whatsapp.md e precisam ser cadastrados no Gerenciador do WhatsApp.
//
// Variáveis de ambiente:
//   WHATSAPP_TOKEN      token de acesso permanente (usuário do sistema)
//   WHATSAPP_PHONE_ID   ID do número de telefone da empresa
//   WHATSAPP_MODE       "dryrun" em ambientes de teste sem credenciais: não envia, só registra
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AlertEvent } from './core/alerts.ts'

const GRAPH = 'https://graph.facebook.com/v21.0'

export const whatsappConfigured = () => Boolean(Deno.env.get('WHATSAPP_TOKEN') && Deno.env.get('WHATSAPP_PHONE_ID'))
export const whatsappDryRun = () => !whatsappConfigured() && Deno.env.get('WHATSAPP_MODE') === 'dryrun'

export type TemplateName =
  | 'olhaonda_codigo'
  | 'olhaonda_boas_vindas'
  | 'olhaonda_aviso_entrou'
  | 'olhaonda_aviso_voltou'
  | 'olhaonda_aviso_mudou'
  | 'olhaonda_aviso_saiu'

/** O WhatsApp recusa variável com quebra de linha, tabulação ou mais de 4 espaços seguidos. */
export const clean = (s: string) => s.replace(/[\r\n\t]+/g, ' ').replace(/ {5,}/g, '    ').trim()

/** Aceita 11 99999-1234, (11) 99999-1234, 5511999991234 ou +5511999991234 e devolve +5511999991234; null se inválido. */
export function normalizeBrPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  let d = digits
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 10 || d.length === 11) d = `55${d}` // com DDD, sem país
  if (!/^55[1-9][0-9][2-9][0-9]{7,8}$/.test(d)) return null // 55 + DDD + (8 ou 9 dígitos)
  if (d.length === 12 && /^[6-9]/.test(d.slice(4))) d = `${d.slice(0, 4)}9${d.slice(4)}` // celular antigo sem o nono dígito
  return `+${d}`
}

/** O WhatsApp devolve números antigos sem o 9: para achar a pessoa, compara com e sem o nono dígito. */
export function phoneVariants(plus: string): string[] {
  const d = plus.replace(/\D/g, '')
  const out = new Set([`+${d}`])
  if (/^55[1-9][0-9]9[0-9]{8}$/.test(d)) out.add(`+${d.slice(0, 4)}${d.slice(5)}`)
  if (/^55[1-9][0-9][6-9][0-9]{7}$/.test(d)) out.add(`+${d.slice(0, 4)}9${d.slice(4)}`)
  return [...out]
}

export type SendResult = { status: 'sent' | 'failed' | 'dry_run'; id?: string; error?: string }

async function graph(path: string, body: unknown): Promise<{ ok: boolean; json: any }> {
  const res = await fetch(`${GRAPH}/${Deno.env.get('WHATSAPP_PHONE_ID')}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('WHATSAPP_TOKEN')}` },
    body: JSON.stringify(body),
  })
  return { ok: res.ok, json: await res.json().catch(() => ({})) }
}

async function log(sb: SupabaseClient, userId: string | null, phone: string, template: string, params: string[], r: SendResult) {
  await sb.from('whatsapp_messages').insert({ user_id: userId, phone, template, params, status: r.status, wa_message_id: r.id ?? null, error: r.error ?? null })
}

/** Envia um modelo aprovado. Registra tudo em whatsapp_messages. */
export async function sendTemplate(sb: SupabaseClient, userId: string | null, phone: string, name: TemplateName, params: string[] = []): Promise<SendResult> {
  const vars = params.map(clean)
  let r: SendResult
  if (!whatsappConfigured()) {
    r = whatsappDryRun() ? { status: 'dry_run' } : { status: 'failed', error: 'WhatsApp não configurado' }
  } else {
    const components: unknown[] = []
    if (vars.length) components.push({ type: 'body', parameters: vars.map((text) => ({ type: 'text', text })) })
    // modelo de autenticação: o botão "copiar código" repete o código
    if (name === 'olhaonda_codigo') components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: vars[0] }] })
    const { ok, json } = await graph('messages', {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'template',
      template: { name, language: { code: 'pt_BR' }, components },
    })
    r = ok ? { status: 'sent', id: json?.messages?.[0]?.id } : { status: 'failed', error: json?.error?.message ?? 'erro desconhecido' }
    if (!ok) console.error('WhatsApp recusou', name, json?.error)
  }
  await log(sb, userId, phone, name, vars, r)
  return r
}

/** Texto livre: só vale dentro de 24 h depois de a pessoa escrever para nós (respostas a PARAR/VOLTAR). */
export async function sendText(sb: SupabaseClient, userId: string | null, phone: string, text: string): Promise<SendResult> {
  let r: SendResult
  if (!whatsappConfigured()) r = whatsappDryRun() ? { status: 'dry_run' } : { status: 'failed', error: 'WhatsApp não configurado' }
  else {
    const { ok, json } = await graph('messages', { messaging_product: 'whatsapp', to: phone.replace('+', ''), type: 'text', text: { body: text } })
    r = ok ? { status: 'sent', id: json?.messages?.[0]?.id } : { status: 'failed', error: json?.error?.message ?? 'erro desconhecido' }
  }
  await log(sb, userId, phone, 'texto_livre', [text], r)
  return r
}

/** Qual modelo e quais variáveis cada tipo de aviso usa (ver docs/whatsapp.md). */
export function alertTemplate(spotName: string, e: AlertEvent, link: string): { name: TemplateName; params: string[] } {
  switch (e.type) {
    case 'enter':
      return { name: 'olhaonda_aviso_entrou', params: [spotName, e.body, link] }
    case 'back':
      return { name: 'olhaonda_aviso_voltou', params: [spotName, e.body, link] }
    case 'change':
      return { name: 'olhaonda_aviso_mudou', params: [spotName, e.body, link] }
    case 'lost':
      return { name: 'olhaonda_aviso_saiu', params: [spotName, `Motivo: ${e.reason}.`, link] }
  }
}
