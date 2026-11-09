# OlhaOnda

Previsão de ondas para surf e bodyboard no litoral brasileiro, com fórum e marketplace de fotos.

![OlhaOnda](docs/preview-desktop.png)

**Stack:** Vite + React + TypeScript · MUI · Iconoir · React Router · Supabase · Mercado Pago

## Rodando

```bash
npm install
npm run dev
```

Sem configuração nenhuma, a previsão funciona e o fórum/fotos rodam em **modo demonstração** (dados só no navegador).
Para ligar contas reais, siga "Colocando no ar" abaixo.

## O que tem

| Área | Recursos |
| --- | --- |
| Início (`/`) | Tela de escolha da praia: busca, "perto de mim", atalho para o último pico e lista por cidade |
| Previsão (`/pico/:id`) | 65 picos (Baixada Santista completa, de Peruíbe a Bertioga, incluindo as 19 praias do Guarujá e o The Rock), altura, swell primário/secundário, **força da onda** em kJ, todas as direções em graus, vento terral/maral, nota 0–5, hora a hora, maré no padrão da Marinha (nível de redução), **tempo** (céu, chuva, UV, máx/mín, 7 dias), rosa dos ventos |
| Fórum (`/forum`) | Tópicos por categoria e por pico, respostas, apagar a própria mensagem, moderadores |
| Fotos (`/fotos`) | Busca por pico e dia, prévias com marca d'água, seleção e compra (Pix/cartão), download do original |
| Fotógrafo (`/fotos/vender`) | Ativar perfil, conectar Mercado Pago, criar sessão, enviar fotos (marca d'água gerada no navegador) |
| Publicidade | Espaços em todas as páginas: venda direta (`HOUSE_ADS`) ou Google AdSense |

## Soluções escolhidas

**Mapa do pico: MapLibre + OpenFreeMap.** O fundo do card principal mostra a região do pico com um marcador, e o
card "O pico" tem um mapa detalhado com as cristas do swell chegando na direção prevista, no ritmo do período real.
O marcador é sempre ajustado para a linha da costa (a coordenada cadastrada pode cair um pouco dentro da terra ou no mar). Os
vetores vêm da OpenFreeMap (gratuita, sem chave, uso comercial liberado; atribuição exibida no card). O MapLibre é
carregado só depois da previsão, para não atrasar a página.

**Card "O pico":** um mapa detalhado do pico com duas camadas alternáveis: *Ondas* (setas do swell coloridas pela
força, no ritmo do período) e *Vento* (setas a favor do vento, coloridas pela velocidade). Abaixo, swell 1, swell 2,
mar de vento e vento da hora escolhida, e uma linha do tempo com play ligada à hora da página.

**Dados de onda e tempo: Open-Meteo.** Junta ECMWF WAM, Météo-France MFWAM e NOAA GFS-Wave, é gratuita para uso
não comercial, sem chave, e chamada direto do navegador. Para uso comercial basta um plano pago (`VITE_OPEN_METEO_API_KEY`).
Força da onda = energia de uma onda por metro de crista, em quilojoules: `E = ρ·g·Hs²·L / 8`, com `L = g·T²/2π`.
Escala: até 100 kJ fraca · 400 moderada · 1.000 forte · 2.500 muito forte · acima disso pesada.

**Contas, fórum e fotos: Supabase.** Um só serviço entrega login (Google e link por e-mail), Postgres, armazenamento
de arquivos e funções de servidor. As permissões ficam no próprio banco (Row Level Security), então o site não precisa
de servidor próprio. O plano gratuito aguenta o começo; o Pro (US$ 25/mês) quando crescer.

**Pagamentos das fotos: Mercado Pago (Checkout Pro + OAuth de marketplace).** Pix e cartão, conhecido por todo
brasileiro, e o **split** é automático: o dinheiro cai na conta do fotógrafo e a comissão da plataforma
(`marketplace_fee`) cai na sua. Isso evita que a plataforma receba e repasse dinheiro de terceiros, o que traria
obrigações fiscais e de intermediação. Alternativa: Stripe Connect, se no futuro quiser vender fora do Brasil.

**Fórum próprio (em vez de Discourse/Discord).** Fica integrado à previsão (tópicos por pico aparecem na página do pico),
usa a mesma conta das fotos e não tem custo extra. Se o volume crescer muito, dá para migrar para Discourse.

**Publicidade: venda direta primeiro, AdSense para completar.** Surf shops, escolas, pousadas e marcas locais pagam
melhor por um público tão segmentado do que o AdSense. Os espaços aceitam os dois.

## Colocando no ar

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. Aplique o banco: `supabase link` e `supabase db push` (ou cole `supabase/migrations/*.sql` no SQL Editor).
3. Auth → Providers: ative **Email** e **Google**. Em URL Configuration, coloque a URL do site.
4. Copie `URL` e `anon key` para `.env.local` (veja `.env.example`).
5. Para tornar alguém moderador: `update profiles set role = 'moderator' where id = '…';`

### 2. Mercado Pago

1. Crie uma aplicação em *Suas integrações* (Checkout Pro, modelo marketplace).
2. Redirect URL do OAuth: `https://<projeto>.supabase.co/functions/v1/mp-oauth`
3. Webhooks: `https://<projeto>.supabase.co/functions/v1/mp-webhook`, evento **Pagamentos**; copie a assinatura secreta.
4. Configure os segredos e publique as funções:

```bash
supabase secrets set SITE_URL=https://olhaonda.com MP_CLIENT_ID=... MP_CLIENT_SECRET=... MP_WEBHOOK_SECRET=... PLATFORM_FEE_PERCENT=20
```

```bash
supabase functions deploy create-checkout
```

```bash
supabase functions deploy mp-webhook --no-verify-jwt
```

```bash
supabase functions deploy mp-oauth --no-verify-jwt
```

### 3. Hospedagem

Qualquer hospedagem estática: Vercel (`vercel.json` incluso), Netlify (`public/_redirects`) ou Cloudflare Pages.
Build: `npm run build`, pasta `dist`.

## Ambientes: staging e produção

| | Staging (homologação) | Produção |
| --- | --- | --- |
| Branch | `staging` | `main` |
| Endereço | `staging.olhaonda.com` | `olhaonda.com` |
| Supabase | projeto `olhaonda-staging` | projeto `olhaonda` |
| Mercado Pago | credenciais **de teste** (`MP_SANDBOX=true`) | credenciais reais |
| Anúncios | só espaços "Anuncie aqui" (sem AdSense) | AdSense e venda direta |
| Google | `noindex` (não aparece em buscas) | indexado |
| Aviso no topo | faixa "STAGING" | nenhum |
| Seções | previsão, fórum e fotos | **só previsão** (fórum e fotos desligados) |
| Picos | todos (65) | **só Baixada Santista com onda** (33: Peruíbe a Bertioga, sem as abrigadas) |

Para ligar fórum ou fotos em produção, defina `VITE_FEATURE_FORUM=true` e/ou `VITE_FEATURE_PHOTOS=true` nas variáveis
de produção e publique de novo. Desligados, os endereços `/forum` e `/fotos` voltam para a previsão e o login some.

Fluxo: trabalho novo vai para `staging`, é testado no endereço de staging e, aprovado, é mesclado em `main`.

```bash
npm run dev:staging        # roda local usando .env.staging
npm run build:staging      # build de staging
npm run build:production   # build de produção
```

### Deploy automático: Cloudflare Pages + domínio da Hostinger (olhaonda.com)

Recomendado: Cloudflare Pages (grátis, uso comercial liberado, deploy a cada push).

1. Em dash.cloudflare.com: *Add a site* com o domínio. A Cloudflare mostra dois *nameservers*.
2. No hPanel da Hostinger: Domínios > seu domínio > DNS / Nameservers > *Alterar nameservers* e cole os dois da
   Cloudflare. A troca leva de minutos a algumas horas.
3. Na Cloudflare: Workers & Pages > Create > Pages > *Connect to Git* > repositório `olhaonda`.
   - Production branch: `main`
   - Build command: `npm run build:ci` (escolhe produção na `main` e staging nas outras branches)
   - Build output directory: `dist`
4. Variáveis: Settings > Environment variables. Em **Production** as de `.env.production.example`; em **Preview**
   as de `.env.staging.example`. Depois de mudar variáveis, refaça o último deploy.
5. Domínios: Custom domains > `olhaonda.com` (e `www`). Para staging, crie o domínio `staging.olhaonda.com`
   apontando (CNAME) para `staging.<projeto>.pages.dev`.

Pronto: todo push na `main` publica a produção; todo push na `staging` publica o staging.

Alternativa: Vercel (`vercel.json` já configurado). No plano gratuito (Hobby) a Vercel só permite uso não
comercial; com anúncios, o plano é o Pro.

**Vercel (site):** um único projeto. Em Settings > Git, *Production Branch* = `main`. Em Domains, aponte
`staging.olhaonda.com` para a branch `staging`. Em Environment Variables, cadastre as variáveis de
`.env.production.example` em *Production* e as de `.env.staging.example` em *Preview* restrito à branch `staging`.

**Supabase (banco e funções):** dois projetos. O workflow `.github/workflows/supabase-deploy.yml` aplica as
migrações e publica as funções no projeto certo a cada push em `staging` ou `main`. Crie no GitHub os environments
`staging` e `production` (este com aprovação obrigatória) com os segredos `SUPABASE_ACCESS_TOKEN`,
`SUPABASE_PROJECT_REF` e `SUPABASE_DB_PASSWORD`. Os segredos das funções (`SITE_URL`, `MP_*`) são configurados
em cada projeto com `supabase secrets set`.

**CI:** `.github/workflows/ci.yml` roda tipos, lint e os dois builds em todo push e pull request.

## Google AdSense (publicidade)

O site já está preparado: página *Sobre e contato* (`/sobre`), política de privacidade (`/privacidade`), aviso de
cookies, `robots.txt` e `sitemap.xml` com todos os picos (gerados no build de produção) e endereço canônico
`https://olhaonda.com` em cada página. Falta só a conta:

1. O domínio principal precisa abrir: na Cloudflare, Workers & Pages > olhaonda > Custom domains > adicione
   `olhaonda.com` (além do `www`). Recomendado: Rules > Redirect Rules > "Redirect from WWW to root".
2. Crie a conta em adsense.google.com com o site `olhaonda.com` (sem `https://` e sem `www`).
3. Na Cloudflare (Settings > Variables and Secrets > Production), defina `VITE_ADSENSE_CLIENT=ca-pub-…` e refaça o
   último deploy. O build gera sozinho a meta tag `google-adsense-account` (verificação) e o arquivo `/ads.txt`.
4. Confira `https://olhaonda.com/ads.txt` e peça a revisão no painel. Depois de aprovado, crie três blocos de anúncio e
   preencha `VITE_ADSENSE_SLOT_LEADERBOARD`, `VITE_ADSENSE_SLOT_RECTANGLE` e `VITE_ADSENSE_SLOT_INLINE`.
5. Envie `https://olhaonda.com/sitemap.xml` no Google Search Console para os picos aparecerem nas buscas.

Atenção: com anúncios o site passa a ser uso comercial, e o plano gratuito da Open-Meteo é só para uso não comercial.
Assine um plano em open-meteo.com e defina `VITE_OPEN_METEO_API_KEY` em Production.

Privacidade: com o AdSense ligado aparece um aviso de cookies (LGPD). Nenhum script do Google carrega antes da
escolha; quem recusa recebe só anúncios não personalizados. A página `/privacidade` traz os textos que o AdSense
exige: revise com um(a) advogado(a) e ajuste `VITE_PRIVACY_CONTACT`. Em staging o AdSense nunca carrega.

## Estrutura

```
src/
  api/openMeteo.ts        previsão (onda, vento, tempo, maré)
  data/spots.ts           picos (lat/lon, orientação, abrigada)
  lib/surf.ts             nota da sessão, terral/maral, força da onda
  backend/                interface única + Supabase + modo demonstração + marca d'água
  auth/                   login (Google, link mágico)
  pages/                  previsão, fórum, fotos
  components/AdSlot.tsx   espaços publicitários
supabase/
  migrations/             tabelas, RLS, storage, gatilhos
  functions/              create-checkout, mp-webhook, mp-oauth
```

### Como a foto fica protegida

1. O fotógrafo escolhe as fotos; o navegador gera uma prévia reduzida com marca d'água.
2. A prévia vai para o bucket público `previews`; o original para o bucket privado `originals`.
3. A política de Storage só libera o original para o próprio fotógrafo ou para quem tem um pedido **pago** com aquela foto.
4. O pedido só vira "pago" pelo webhook do Mercado Pago, com assinatura verificada e valor conferido.

### Paleta

`#4B1D5A` roxo · `#7A2E6E` vinho · `#0F4C3A` verde profundo · `#2FAE7B` verde · `#F5E6D3` areia
