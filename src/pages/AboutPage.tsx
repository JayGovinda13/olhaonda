import { Box, Link, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { SPOTS } from '../data/spots'
import { usePageMeta } from '../lib/meta'

const CONTACT = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || 'contato@olhaonda.com'
const ADS = 'anuncie@olhaonda.com'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ '& p': { mb: 1.5 }, '& ul': { pl: 3, mb: 1.5 }, '& li': { mb: 0.5 } }}>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography component="div" variant="body1" sx={{ opacity: 0.85 }}>
        {children}
      </Typography>
    </Box>
  )
}

/** Sobre e contato: o que é o site, de onde vêm os dados e como falar com a gente. */
export default function AboutPage() {
  const cities = [...new Set(SPOTS.map((s) => s.city))]
  usePageMeta({
    title: 'Sobre e contato · OlhaOnda',
    description: 'O que é o OlhaOnda, de onde vêm os dados da previsão de ondas, como ler swell, vento, força da onda e maré, e como entrar em contato.',
    path: '/sobre',
  })

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 820, mx: 'auto' }}>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 38 }, mb: 3 }}>
        Sobre o OlhaOnda
      </Typography>

      <Box sx={{ display: 'grid', gap: 3 }}>
        <Section title="O que é">
          <p>
            O OlhaOnda é uma previsão de ondas feita para quem pega onda: surfistas e bodyboarders do litoral brasileiro.
            Hoje cobrimos {SPOTS.length} picos com onda em {cities.length} cidades ({cities.join(', ')}), cada um com a
            posição e a orientação da praia conferidas no mapa, porque é isso que decide se o vento é terral ou maral e se o
            swell entra ou não.
          </p>
          <p>A ideia é simples: abrir o site e, em poucos segundos, saber como vai estar o mar no seu pico, hora a hora.</p>
        </Section>

        <Section title="De onde vêm os dados">
          <ul>
            <li>
              <strong>Ondas:</strong> modelos ECMWF WAM, Météo-France MFWAM e NOAA GFS-Wave, combinados pela{' '}
              <Link href="https://open-meteo.com/" target="_blank" rel="noopener">
                Open-Meteo
              </Link>
              . Usamos o ponto de mar mais próximo de cada pico.
            </li>
            <li>
              <strong>Vento e tempo:</strong> modelos meteorológicos globais e regionais, também via Open-Meteo.
            </li>
            <li>
              <strong>Maré:</strong> nível do mar previsto, ajustado ao nível de redução do porto de referência, no padrão
              das tábuas da Marinha (DHN).
            </li>
          </ul>
          <p>Toda previsão é uma estimativa. Confira o mar antes de entrar e respeite seus limites.</p>
        </Section>

        <Section title="Como ler a previsão">
          <ul>
            <li>
              <strong>Swell:</strong> a ondulação que vem de longe. Mostramos altura, período (segundos entre uma onda e outra)
              e direção em graus. Período maior quer dizer onda com mais força.
            </li>
            <li>
              <strong>Força da onda:</strong> a energia de uma onda por metro de crista, em quilojoules (kJ). Junta altura e
              período num número só: até 100 kJ é fraca; acima de 1.000 kJ, forte.
            </li>
            <li>
              <strong>Vento terral ou maral:</strong> terral sopra da terra para o mar e arruma a onda; maral sopra do mar e
              bagunça. Vento acima de 20 km/h conta como forte.
            </li>
            <li>
              <strong>Maré:</strong> altura em metros acima do nível de redução, com o horário de cada preamar e baixa-mar.
            </li>
          </ul>
        </Section>

        <Section title="Anuncie">
          <p>
            Surf shops, escolas de surf, pousadas e marcas podem anunciar direto para quem está olhando o mar da região.
            Escreva para <Link href={`mailto:${ADS}`}>{ADS}</Link>.
          </p>
        </Section>

        <Section title="Contato">
          <p>
            Dúvidas, sugestões de picos, correções de posição ou orientação de uma praia:{' '}
            <Link href={`mailto:${CONTACT}`}>{CONTACT}</Link>.
          </p>
          <p>
            Sobre dados pessoais e cookies, veja a{' '}
            <Link component={RouterLink} to="/privacidade">
              política de privacidade
            </Link>
            .
          </p>
        </Section>
      </Box>
    </Paper>
  )
}
