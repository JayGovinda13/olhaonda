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
| Previsão (`/`) | 43 picos (todas as 19 praias do Guarujá), altura, swell primário/secundário, **força da onda** (kW/m), vento terral/maral, nota 0–5, hora a hora, maré, **tempo** (céu, chuva, UV, máx/mín, 7 dias), rosa dos ventos |
| Fórum (`/forum`) | Tópicos por categoria e por pico, respostas, apagar a própria mensagem, moderadores |
| Fotos (`/fotos`) | Busca por pico e dia, prévias com marca d'água, seleção e compra (Pix/cartão), download do original |
| Fotógrafo (`/fotos/vender`) | Ativar perfil, conectar Mercado Pago, criar sessão, enviar fotos (marca d'água gerada no navegador) |
| Publicidade | Espaços em todas as páginas: venda direta (`HOUSE_ADS`) ou Google AdSense |

## Soluções escolhidas

**Dados de onda e tempo: Open-Meteo.** Junta ECMWF WAM, Météo-France MFWAM e NOAA GFS-Wave, é gratuita para uso
não comercial, sem chave, e chamada direto do navegador. Para uso comercial basta um plano pago (`VITE_OPEN_METEO_API_KEY`).
Força da onda = fluxo de energia `P ≈ 0,49 · Hs² · Te` (kW por metro de crista).

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
supabase secrets set SITE_URL=https://olhaonda.com.br MP_CLIENT_ID=... MP_CLIENT_SECRET=... MP_WEBHOOK_SECRET=... PLATFORM_FEE_PERCENT=20
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
