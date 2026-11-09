# OlhaOnda

Previsão de ondas para surf e bodyboard no litoral brasileiro.

**Stack:** Vite + React + TypeScript · MUI · Iconoir · fonte Manrope

## Rodando

```bash
npm install
npm run dev
```

## Dados — Open-Meteo

| API | O que traz |
| --- | --- |
| [Marine API](https://open-meteo.com/en/docs/marine-weather-api) | Altura significativa, swell primário e secundário (altura, período, período de pico e direção), mar de vento, temperatura da água, nível do mar (maré) |
| [Forecast API](https://open-meteo.com/en/docs) | Vento a 10 m, rajadas, temperatura do ar, nascer/pôr do sol |

O `best_match` combina **ECMWF WAM**, **Météo-France MFWAM** e **NOAA GFS-Wave**. A API é gratuita para uso não comercial, sem chave e com CORS, por isso o app roda 100% no navegador.
Para uso comercial, contrate um plano e defina `VITE_OPEN_METEO_API_KEY` no `.env`; o cliente troca sozinho para os endpoints `customer-*`.

Alternativa paga: [Stormglass](https://stormglass.io) agrega NOAA, Météo-France, DWD, UK Met Office e outros, mas o plano grátis tem só 10 requisições por dia e exige um backend para guardar a chave.

## Estrutura

```
src/
  api/openMeteo.ts      cliente da API (+ cache de 30 min)
  data/spots.ts         picos (lat/lon, orientação da praia, tipo de fundo)
  lib/surf.ts           nota da sessão, terral/maral, formatação
  components/Logo.tsx   logo: os dois "O" são as lentes de um binóculo
  components/…          painel atual, dias, hora a hora, maré, rosa dos ventos
  theme.ts              paleta e tema MUI
```

### Nota da sessão (0–5)

Heurística aberta em `src/lib/surf.ts`: altura do swell ponderada pela exposição da praia
(ângulo entre a direção do swell e `facing`), bônus pelo período e penalidade de vento
maral/lateral proporcional à velocidade. Ajuste a orientação (`facing`) de cada pico em `src/data/spots.ts`.

### Paleta

`#4B1D5A` roxo (marca/texto) · `#7A2E6E` vinho · `#0F4C3A` verde profundo · `#2FAE7B` verde (dados bons) · `#F5E6D3` areia (fundo)
