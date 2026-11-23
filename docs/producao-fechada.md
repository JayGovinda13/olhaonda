# Fórum em produção: teste fechado com até 10 pessoas

O site continua aberto para a previsão. O fórum, os favoritos e os avisos só funcionam para quem o administrador liberar.
Sem fotos e sem WhatsApp. Os avisos saem pelo sino do site e pelo push do navegador.

## O que protege o acesso

- As regras do banco (RLS) só deixam ler e escrever no fórum, favoritar e receber avisos quem foi liberado (`is_member()`).
  Isso vale mesmo que alguém chame a API direto: esconder a tela não é a única barreira.
- Perfis de outras pessoas só aparecem para quem foi liberado.
- Limite de liberados (padrão **10**, administradores não contam): `app_settings.max_members`.
- Quem se cadastra fica "aguardando"; a rodada de avisos ignora contas não liberadas.

## Um só projeto Supabase para staging e produção (plano grátis: 2 projetos)

Produção e staging usam o **mesmo** projeto Supabase. Consequências:

- Contas, fórum e favoritos são compartilhados entre os dois sites. Cuidado ao testar no staging: o que for criado lá aparece em produção.
- Uma migração ruim testada no staging afeta a produção. Enquanto forem só 10 pessoas é aceitável; ao abrir para todos, crie um projeto
  separado (plano Pro, US$ 25/mês).
- Só **uma** rodada de avisos deve rodar: use o agendador que já existe (`daily-forecast.yml`, environment `staging`). Não crie o `production-cron`.
- `SITE_URL` e `SPOT_SCOPE` valem para o projeto inteiro: defina só no environment `production` e deixe vazios no `staging`
  (o deploy só grava o que não estiver vazio).
- Pergunta de segurança já tratada: as funções aceitam qualquer origem (CORS `*`), porque exigem o token de login.

## Convites (cadastro só por link)

Não há mais limite de pessoas. O cadastro só funciona por um **link de convite** criado em `/admin` → "Links de convite"
(nome opcional, quantas pessoas podem usar e por quantos dias vale). Quem se cadastra pelo link já nasce liberado.
O link tem a forma `https://olhaonda.com/cadastro?convite=CODIGO`; pode ser cancelado a qualquer momento (quem já entrou continua).
A regra vale no banco (migration `20261123000000_convites.sql`): sem convite válido a conta nem é criada, mesmo chamando a API direto.
Para voltar ao cadastro aberto: `update public.app_settings set invite_only = false;` (as contas novas então entram sem liberação automática).
Contas criadas à mão pelo painel do Supabase (Authentication → Add user) também são barradas; crie-as com um convite no `user_metadata`
(`{"invite": "CODIGO"}`) ou desligue `invite_only` por um instante.

## Agendamento dos avisos (a cada 3 horas, no minuto certo)

Quem dispara é o **pg_cron do Supabase** (migration `20261116000000_agendamento_avisos.sql`), não o GitHub, que atrasa e pula horários.
Horários (Brasília): 05:13 resumo do fórum + avisos; 08:43, 11:43, 14:43, 17:43, 20:43, 23:43 e 02:43 só avisos.
Configure uma única vez no **SQL Editor** do Supabase (os valores ficam no Vault; não vão para o código nem para o chat):

```sql
select vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'cron_secret');
select vault.create_secret('https://SEU_REF.supabase.co/functions/v1/daily-forecast', 'daily_forecast_url');
```

Conferir: `select jobname, schedule from cron.job;` e, depois de um horário,
`select status, start_time from cron.job_run_details order by start_time desc limit 5;`
e `select status_code, created from net._http_response order by created desc limit 5;` (200 = ok).
Teste na hora: `select public.run_daily_forecast(true);`.
O workflow do GitHub fica só como reserva e para rodar na mão.

## Passo a passo

1. **GitHub → Environments → `production`**: copie do `staging` os mesmos `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`,
   `SUPABASE_DB_PASSWORD` e `CRON_SECRET`. Variáveis: `SITE_URL=https://olhaonda.com`, `SPOT_SCOPE=prod`. Mantenha os revisores obrigatórios.
   No `staging`, apague as variáveis `SITE_URL` e `SPOT_SCOPE`.
2. **Chaves de push** (se ainda não existem no projeto): `npx web-push generate-vapid-keys`; a privada e `VAPID_SUBJECT=mailto:...`
   viram segredos (`supabase secrets set`). A pública vai no `VITE_VAPID_PUBLIC_KEY` dos dois sites.
3. **Cloudflare (produção)**: `VITE_FEATURE_FORUM=true`, a **mesma** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do staging,
   `VITE_VAPID_PUBLIC_KEY` e `VITE_PRIVACY_CONTROLLER="Seu nome ou razão social, CNPJ/CPF"`.
   Deixe `VITE_FEATURE_PHOTOS` e `VITE_FEATURE_WHATSAPP` desligados (padrão).
4. **Supabase → Auth → URL Configuration**: *Site URL* `https://olhaonda.com`; em *Redirect URLs* inclua também
   `https://staging.olhaonda.com/**`. Ligue *Confirm email* e configure um SMTP próprio (o e-mail padrão tem limite baixo).
5. **Zerar quem já tinha acesso**: a migração liberou todas as contas que existiam no staging. Para o teste valer só para as 10 pessoas
   (e para as contas de teste não ocuparem as vagas), rode no *SQL Editor*:
   ```sql
   update public.profiles set approved_at = null, approved_by = null where role = 'user';
   ```
6. **Publicar**: o deploy do `staging` (ou do `main`, com aprovação) aplica a migração e publica as funções, inclusive `account-delete`.
7. **Primeiro administrador**: crie a sua conta, confirme o e-mail e rode:
   ```sql
   update public.profiles set role = 'admin', approved_at = now()
   where id = (select id from auth.users where email = 'SEU@EMAIL');
   ```
8. Entre no site → menu da conta → **Administração**. Quem se cadastrar aparece em "Aguardando"; ligue a chave para liberar.

## Ajustes por SQL

```sql
update public.app_settings set max_members = 20;   -- novo limite de liberados
update public.app_settings set invite_only = false; -- abre para qualquer conta confirmada (fim do teste)
```

## LGPD: o que está feito

- Aceite da política e declaração de 18 anos no cadastro; a data e a versão do aceite ficam na conta (`terms_version`, `terms_accepted_at`).
- Política de privacidade com dados coletados, finalidade e base legal, fornecedores (Supabase, Cloudflare, Open-Meteo), transferência
  internacional, prazo de guarda, direitos e incidente. **Preencha o controlador (`VITE_PRIVACY_CONTROLLER`) e peça revisão jurídica antes de abrir.**
- Direitos do titular sem depender de e-mail: **Meu perfil → Baixar meus dados** (JSON) e **Excluir minha conta**
  (apaga login, perfil, favoritos, avisos, inscrições push e o que publicou).
- Minimização: o administrador vê só nome, apelido, e-mail e cidade, para decidir a liberação; cada liberação/bloqueio fica
  registrado (`admin_audit`) sem guardar mais dados da pessoa depois que ela exclui a conta.
- Retenção: avisos com mais de 180 dias são apagados; registros do WhatsApp, em 90 dias.
- Senhas ficam com o Supabase Auth (hash). Nada de dado pessoal vai para o Google Analytics; anúncios só depois do consentimento.

## Para o fim do teste

Aumente `max_members` ou desligue `invite_only`, e só então divulgue o site. Para fotos e WhatsApp: ligue as flags correspondentes
(`VITE_FEATURE_PHOTOS`, `VITE_FEATURE_WHATSAPP`) e siga `docs/whatsapp.md`.
