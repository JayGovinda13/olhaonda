# Avisos de pico no WhatsApp (staging)

A pessoa favorita um pico, define o gosto (ondulação: tamanho, direção em graus, período; potência em kJ;
vento: direção em graus ou tipo, velocidade; maré, horário) e recebe avisos pelo WhatsApp, no site e por push.

## Ciclo do aviso (por pico favorito, janela de até 7 dias)

| Situação | Aviso | Modelo |
|---|---|---|
| Nada avisado ainda e uma janela bate | **Entrou** na sua condição | `olhaonda_aviso_entrou` |
| Já avisado e a janela mudou (dia novo/removido, horário ±2 h, tamanho ±0,3 m; no máx. a cada 3 h) | **Mudou** | `olhaonda_aviso_mudou` |
| Já avisado e nenhuma janela bate mais | **Saiu**, com o motivo de cada critério | `olhaonda_aviso_saiu` |
| Depois de "saiu", volta a bater | **Voltou** | `olhaonda_aviso_voltou` |

Depois de "saiu" nada mais é enviado até voltar. Se as janelas avisadas apenas passaram, o ciclo recomeça em silêncio.
Mudar o gosto, desligar o aviso ou desfavoritar zera o ciclo. A conferência roda de 3 em 3 horas (`daily-forecast.yml`).

## Configuração na Meta (WhatsApp Cloud API)

1. developers.facebook.com → criar app tipo *Business* → produto **WhatsApp**; conta WhatsApp Business e número próprio.
2. Usuário do sistema com token permanente (`whatsapp_business_messaging`, `whatsapp_business_management`).
3. Webhook: URL `https://<projeto>.supabase.co/functions/v1/whatsapp-webhook`, token de verificação = `WHATSAPP_VERIFY_TOKEN`,
   campo `messages`. O app secret vai em `WHATSAPP_APP_SECRET` (a assinatura `x-hub-signature-256` é conferida).
4. Cadastrar os modelos abaixo (idioma `pt_BR`, categoria **Utility**; o do código, **Authentication**) e esperar a aprovação.

### Modelos (corpo exato)

- `olhaonda_aviso_entrou` — `🏄 {{1}} entrou na sua condição! {{2}} Veja: {{3}}`
- `olhaonda_aviso_mudou` — `🔄 {{1}}: a previsão mudou. {{2}} Veja: {{3}}`
- `olhaonda_aviso_saiu` — `🚫 {{1}} saiu da sua condição. {{2}} Aviso de novo se voltar. {{3}}`
- `olhaonda_aviso_voltou` — `✅ {{1}} voltou à sua condição! {{2}} Veja: {{3}}`
- `olhaonda_codigo` — Authentication, com botão "copiar código" (variável {{1}} = código de 6 dígitos)
- `olhaonda_boas_vindas` — `Pronto! Você vai receber aqui os avisos do OlhaOnda. Para parar, responda PARAR.`

Variáveis não aceitam quebra de linha, tabulação nem mais de 4 espaços (o envio já limpa isso).

## Segredos das Edge Functions

```bash
supabase secrets set WHATSAPP_TOKEN=... WHATSAPP_PHONE_ID=... WHATSAPP_VERIFY_TOKEN=... WHATSAPP_APP_SECRET=...
# sem credenciais, em teste: não envia nada, só registra em whatsapp_messages e mostra o código na tela
supabase secrets set WHATSAPP_MODE=dryrun
```

Deploy: `whatsapp-link`, `whatsapp-webhook` (sem JWT), `daily-forecast` (workflow `supabase-deploy.yml`) e a migração
`20261114000000_alertas_whatsapp.sql`.

## Consentimento e parar

- O número só é ligado depois do aceite explícito e do código recebido no próprio WhatsApp (10 min, 5 tentativas, 5 envios/dia).
- Responder **PARAR** desliga; **VOLTAR** religa (texto livre só vale na janela de 24 h aberta pela resposta da pessoa).
- Tudo enviado fica em `whatsapp_messages` (só o servidor lê).

## Limites

- A potência (kJ) usa a energia da onda em mar aberto, não a do pico.
- Além de ~7 dias a previsão é tendência; o aviso olha no máximo 7.
- Cada mensagem iniciada por nós é cobrada pela Meta por conversa.
