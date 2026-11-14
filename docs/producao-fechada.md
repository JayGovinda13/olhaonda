# Fórum em produção: teste fechado com até 10 pessoas

O site continua aberto para a previsão. O fórum, os favoritos e os avisos só funcionam para quem o administrador liberar.
Sem fotos e sem WhatsApp. Os avisos saem pelo sino do site e pelo push do navegador.

## O que protege o acesso

- As regras do banco (RLS) só deixam ler e escrever no fórum, favoritar e receber avisos quem foi liberado (`is_member()`).
  Isso vale mesmo que alguém chame a API direto: esconder a tela não é a única barreira.
- Perfis de outras pessoas só aparecem para quem foi liberado.
- Limite de liberados (padrão **10**, administradores não contam): `app_settings.max_members`.
- Quem se cadastra fica "aguardando"; a rodada de avisos ignora contas não liberadas.

## Passo a passo

1. **Supabase de produção**: crie o projeto (região São Paulo, se disponível). Anote o *project ref*, a senha do banco, a URL e a chave `anon`.
2. **GitHub → Settings → Environments → `production`**: segredos `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `CRON_SECRET`
   (senha longa). Variáveis `SITE_URL=https://olhaonda.com` e `SPOT_SCOPE=prod`. Mantenha os revisores obrigatórios.
3. **Agendador**: crie o environment `production-cron` **sem revisores**, com `SUPABASE_PROJECT_REF` e o mesmo `CRON_SECRET`.
   (O `production` pede aprovação a cada execução e travaria os avisos de 3 em 3 horas.)
4. **Chaves de push**: `npx web-push generate-vapid-keys`; a privada e `VAPID_SUBJECT=mailto:...` vão como segredo do `production`.
5. **Cloudflare (produção)**: `VITE_FEATURE_FORUM=true`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`,
   `VITE_PRIVACY_CONTROLLER="Seu nome ou razão social, CNPJ/CPF"`. Deixe `VITE_FEATURE_PHOTOS` e `VITE_FEATURE_WHATSAPP` desligados (padrão).
6. **Supabase → Auth**: ligue *Confirm email*, defina o *Site URL* `https://olhaonda.com` e configure um SMTP próprio (o e-mail padrão tem limite baixo).
7. **Publicar**: o push no `main` roda o `supabase-deploy`; aprove o environment `production`. Ele aplica as migrações e publica as funções.
8. **Primeiro administrador**: crie a sua conta no site, confirme o e-mail e rode no *SQL Editor* do Supabase:
   ```sql
   update public.profiles set role = 'admin', approved_at = now()
   where id = (select id from auth.users where email = 'SEU@EMAIL');
   ```
9. Entre no site → menu da conta → **Administração**. Quem se cadastrar aparece em "Aguardando"; ligue a chave para liberar.

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
