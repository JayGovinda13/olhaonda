import { Box, Button, Link, Paper, Stack, Typography } from '@mui/material'
import { type ReactNode } from 'react'
import { ADS_ENABLED } from '../config/ads'
import { FEATURES, HAS_COMMUNITY } from '../config/env'
import { consentStore, useConsent } from '../lib/consent'
import { usePageMeta } from '../lib/meta'

const CONTACT = (import.meta.env.VITE_PRIVACY_CONTACT as string | undefined) ?? 'privacidade@olhaonda.com'
const UPDATED = '9 de novembro de 2026'

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

/**
 * Política de privacidade (rascunho). Revise com um(a) advogado(a) antes de publicar;
 * os trechos sobre o Google atendem ao que o AdSense exige dos sites parceiros.
 */
export default function PrivacyPage() {
  const consent = useConsent()
  usePageMeta({
    title: 'Privacidade e cookies · OlhaOnda',
    description: 'Como o OlhaOnda trata dados pessoais e cookies, incluindo os anúncios do Google AdSense (LGPD).',
    path: '/privacidade',
  })

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 820, mx: 'auto' }}>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 38 } }}>
        Política de privacidade e cookies
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.6, mt: 0.5, mb: 3 }}>
        Atualizada em {UPDATED}
      </Typography>

      <Stack spacing={3}>
        <Section title="Quem somos">
          <p>
            O OlhaOnda é um site de previsão de ondas para surf e bodyboard. Dúvidas ou pedidos sobre seus dados:{' '}
            <Link href={`mailto:${CONTACT}`} color="secondary">
              {CONTACT}
            </Link>
            .
          </p>
        </Section>

        <Section title="O que coletamos">
          <ul>
            <li>
              <b>Preferências no seu navegador</b> (armazenamento local): último pico visto e sua escolha de cookies.
              Esses dados não saem do seu aparelho.
            </li>
            <li>
              <b>Localização</b>, só se você tocar em "pico mais perto de mim". Ela é usada no próprio navegador para
              achar o pico e não é enviada nem guardada por nós.
            </li>
            <li>
              <b>Previsões</b>: para buscar os dados de ondas e tempo, o site consulta a Open-Meteo com as coordenadas
              do pico escolhido (não as suas).
            </li>
            {HAS_COMMUNITY && (
              <li>
                <b>Conta</b>: ao entrar, guardamos nome, e-mail e foto do perfil (Supabase) e o que você publica
                {FEATURES.forum ? ' no fórum' : ''}
                {FEATURES.photos ? '. Pagamentos de fotos são processados pelo Mercado Pago; não vemos dados do seu cartão' : ''}.
              </li>
            )}
          </ul>
        </Section>

        <Section title="Anúncios e cookies do Google">
          <p>
            Exibimos anúncios do Google AdSense. Fornecedores terceiros, incluindo o Google, usam cookies para veicular
            anúncios com base em visitas anteriores a este e a outros sites. Os cookies de publicidade permitem que o
            Google e seus parceiros veiculem anúncios com base nessas visitas.
          </p>
          <p>
            Você pode desativar a publicidade personalizada nas{' '}
            <Link href="https://adssettings.google.com" target="_blank" rel="noopener" color="secondary">
              Configurações de anúncios do Google
            </Link>{' '}
            e saber mais em{' '}
            <Link href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener" color="secondary">
              como o Google usa dados de sites parceiros
            </Link>
            .
          </p>
          <p>
            Aqui no OlhaOnda, nenhum script de anúncio é carregado antes da sua escolha. Se você optar por "só não
            personalizados", pedimos ao Google anúncios sem perfil de interesses.
          </p>
          {ADS_ENABLED && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Sua escolha atual:{' '}
                {consent === 'granted' ? 'anúncios personalizados' : consent === 'denied' ? 'só não personalizados' : 'ainda não escolhida'}
              </Typography>
              <Button size="small" variant="outlined" onClick={() => consentStore.set(null)} sx={{ borderRadius: 99 }}>
                Mudar escolha
              </Button>
            </Stack>
          )}
        </Section>

        <Section title="Seus direitos (LGPD)">
          <p>
            Pela Lei Geral de Proteção de Dados (Lei 13.709/2018) você pode pedir acesso, correção, portabilidade ou
            exclusão dos seus dados e revogar consentimentos a qualquer momento, pelo e-mail acima.
          </p>
        </Section>
      </Stack>
    </Paper>
  )
}
