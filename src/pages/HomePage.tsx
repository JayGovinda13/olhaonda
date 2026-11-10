import { Box, Breadcrumbs, Button, ButtonBase, Link, Paper, Stack, Typography, useMediaQuery } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { ArrowLeft, ArrowRight, Position } from 'iconoir-react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { HomeMap, type MapItem } from '../components/home/HomeMap'
import { Wordmark } from '../components/Logo'
import { SpotPicker } from '../components/SpotPicker'
import { cities, spotsIn, STATE_NAMES, states } from '../data/hierarchy'
import { DEFAULT_SPOT_ID, KIND_LABEL, nearestSpot, SPOTS, type Spot } from '../data/spots'
import { useLocalState } from '../hooks/useLocalState'
import { usePageMeta } from '../lib/meta'
import { dirDeg } from '../lib/surf'
import { brand } from '../theme'

const MAP_H = 520

/**
 * Tela de início: escolha da praia no mapa, em níveis.
 * Estado → cidade → pico. Com um estado só (produção hoje: SP/Baixada), começa direto nas cidades.
 * O nível fica no endereço (?uf=SP&cidade=Guarujá), então o "voltar" do navegador funciona.
 */
export default function HomePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [savedId] = useLocalState('olhaonda:spot', DEFAULT_SPOT_ID)
  const [locating, setLocating] = useState(false)
  // no celular a tela de início é só a lista (o mapa nem carrega)
  const showMap = useMediaQuery(useTheme().breakpoints.up('md'), { noSsr: true })
  const last = SPOTS.find((s) => s.id === savedId)

  const allStates = useMemo(() => states(), [])
  const singleState = allStates.length === 1 ? allStates[0].key : null
  const uf = params.get('uf') ?? singleState
  const city = uf ? params.get('cidade') : null
  const cityList = useMemo(() => (uf ? cities(uf) : []), [uf])
  const spotList = useMemo(() => (uf && city ? spotsIn(uf, city) : []), [uf, city])

  usePageMeta({
    title: 'OlhaOnda · Previsão de ondas para surf e bodyboard',
    description:
      'Previsão de ondas de 14 dias, grátis, para surf e bodyboard no litoral de São Paulo: Ubatuba, Maresias, Ilhabela, Guarujá, Santos, Praia Grande, Peruíbe, Ilha Comprida e mais. Swell, vento, maré e tempo.',
    path: '/',
  })

  const go = (s: Spot | null) => s && navigate(`/pico/${s.id}`)
  const setLevel = (next: { uf?: string | null; cidade?: string | null }) => {
    const p = new URLSearchParams()
    if (next.uf && next.uf !== singleState) p.set('uf', next.uf)
    if (next.uf && next.cidade) {
      if (next.uf === singleState) p.set('uf', next.uf)
      p.set('cidade', next.cidade)
    }
    setParams(p)
  }

  // itens do mapa no nível atual
  const items: MapItem[] = useMemo(() => {
    if (!uf) return allStates.map((pl) => ({ type: 'place', place: pl, onClick: () => setLevel({ uf: pl.key }) }))
    if (!city) return cityList.map((pl) => ({ type: 'place', place: pl, onClick: () => setLevel({ uf, cidade: pl.key }) }))
    return spotList.map((s) => ({ type: 'spot', spot: s, active: s.id === savedId, onClick: () => go(s) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uf, city, cityList, spotList, allStates, savedId])

  // links antigos (/?pico=…) continuam funcionando
  const legacy = params.get('pico')
  if (legacy && SPOTS.some((s) => s.id === legacy)) return <Navigate to={`/pico/${legacy}`} replace />

  const nearMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        go(nearestSpot(pos.coords.latitude, pos.coords.longitude))
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }

  const title = !uf ? 'Escolha o estado' : !city ? 'Escolha a cidade' : 'Escolha o pico'
  const back = city ? () => setLevel({ uf }) : uf && !singleState ? () => setLevel({}) : null

  return (
    <Stack spacing={3}>
      {/* destaque */}
      <Box sx={{ textAlign: 'center', pt: { xs: 0, md: 3 } }}>
        <Box sx={{ display: { xs: 'none', md: 'inline-block' }, mb: 2 }}>
          <Wordmark height={48} />
        </Box>
        {/* destaque: 14 dias grátis */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
            px: 1.75,
            py: 0.75,
            borderRadius: 99,
            bgcolor: brand.deepGreen,
            color: brand.sand,
            fontWeight: 800,
            fontSize: { xs: 13, md: 15 },
            boxShadow: '0 6px 18px rgba(15,76,58,.25)',
          }}
        >
          <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: 99, bgcolor: brand.green, color: '#fff', fontSize: { xs: 12, md: 13 } }}>
            14 dias
          </Box>
          de previsão, 100% grátis
        </Box>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 26, md: 40 } }}>
          Onde você vai cair hoje?
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'center', alignItems: 'stretch', mt: { xs: 2, md: 2.5 } }}>
          <Box sx={{ width: '100%', maxWidth: { sm: 420 } }}>
            <SpotPicker value={null} onChange={go} allowEmpty locate={false} placeholder="Buscar praia ou pico" width="100%" />
          </Box>
          <Button
            variant="outlined"
            onClick={nearMe}
            disabled={locating}
            startIcon={<Position width={18} height={18} />}
            sx={{ borderRadius: 99, whiteSpace: 'nowrap', bgcolor: 'background.paper', minHeight: 44 }}
          >
            Perto de mim
          </Button>
        </Stack>
        {last && (
          <Button
            onClick={() => go(last)}
            endIcon={<ArrowRight width={16} height={16} />}
            sx={{ mt: 1.25, borderRadius: 99, fontWeight: 800, maxWidth: '100%', '& .MuiButton-endIcon': { flexShrink: 0 } }}
          >
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Continuar em {last.name} · {last.city}
            </Box>
          </Button>
        )}
      </Box>

      {/* mapa + lista do nível atual */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,2fr) minmax(0,1fr)' }, gap: 2, alignItems: 'start' }}>
        {showMap && <HomeMap items={items} height={MAP_H} />}

        <Paper sx={{ p: { xs: 2, sm: 2.5 }, maxHeight: { md: MAP_H }, display: 'flex', flexDirection: 'column' }}>
          <Breadcrumbs sx={{ fontSize: 13, mb: 0.5 }}>
            {!singleState && (
              <Link component="button" underline="hover" color="inherit" onClick={() => setLevel({})}>
                Brasil
              </Link>
            )}
            {uf && (
              <Link component="button" underline="hover" color="inherit" onClick={() => setLevel({ uf })}>
                {singleState ? 'Litoral de São Paulo' : (STATE_NAMES[uf] ?? uf)}
              </Link>
            )}
            {city && <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{city}</Typography>}
          </Breadcrumbs>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
            {back && (
              <Button size="small" onClick={back} startIcon={<ArrowLeft width={16} height={16} />} sx={{ minWidth: 0, px: 1 }}>
                Voltar
              </Button>
            )}
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          </Stack>

          <Stack spacing={1} sx={{ overflowY: 'auto', pr: 0.5 }}>
            {!uf &&
              allStates.map((pl) => (
                <Row key={pl.key} title={pl.name} sub={`${pl.count} picos`} onClick={() => setLevel({ uf: pl.key })} />
              ))}
            {uf &&
              !city &&
              cityList.map((pl) => (
                <Row key={pl.key} title={pl.name} sub={`${pl.count} ${pl.count === 1 ? 'pico' : 'picos'}`} onClick={() => setLevel({ uf, cidade: pl.key })} />
              ))}
            {city &&
              spotList.map((s) => (
                <Row key={s.id} title={s.name} sub={`${KIND_LABEL[s.kind]} · ${dirDeg(s.facing)}`} onClick={() => go(s)} active={s.id === savedId} />
              ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}

function Row({ title, sub, onClick, active }: { title: string; sub: string; onClick: () => void; active?: boolean }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'left',
        width: '100%',
        px: 1.5,
        py: 1.25,
        minHeight: 56,
        borderRadius: '12px',
        border: `1px solid ${alpha(brand.purple, active ? 0.4 : 0.1)}`,
        bgcolor: active ? alpha(brand.green, 0.1) : 'transparent',
        '&:hover': { bgcolor: alpha(brand.green, 0.1) },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800 }} noWrap>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {sub}
        </Typography>
      </Box>
      <ArrowRight width={18} height={18} color={brand.plum} />
    </ButtonBase>
  )
}
