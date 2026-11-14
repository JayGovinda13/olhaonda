import { Box, Breadcrumbs, Button, ButtonBase, Link, Paper, Stack, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowLeft, ArrowRight, Position } from 'iconoir-react'
import { useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { HomeMap, type MapItem } from '../components/home/HomeMap'
import { Wordmark } from '../components/Logo'
import { SpotPicker } from '../components/SpotPicker'
import { cities, spotsIn, STATE_NAMES, states } from '../data/hierarchy'
import { DEFAULT_SPOT_ID, distanceKm, KIND_LABEL, SPOTS, type Spot } from '../data/spots'
import { useLocalState } from '../hooks/useLocalState'
import { getPosition, inAppBrowser, openInChromeUrl } from '../lib/geo'
import { usePageMeta } from '../lib/meta'
import { dirDeg } from '../lib/surf'
import { alpha, brand } from '../theme'

const MAP_H = 520

/** Navegador interno do Instagram/Facebook não pede a localização: ensina a abrir no navegador de verdade. */
function InAppHelp({ app }: { app: string }) {
  const [copied, setCopied] = useState(false)
  const android = /Android/i.test(navigator.userAgent)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.origin + '/')
      setCopied(true)
    } catch {
      window.prompt('Copie o endereço e cole no Safari ou no Chrome:', location.origin + '/')
    }
  }
  return (
    <Box sx={{ mt: 1.5, p: 1.75, borderRadius: '16px', border: `1.5px solid ${alpha(brand.plum, 0.35)}`, bgcolor: alpha(brand.plum, 0.06), textAlign: 'left' }}>
      <Typography variant="body2" sx={{ fontWeight: 800, color: brand.purple }}>
        {app === 'app' ? 'Este navegador' : `O navegador do ${app}`} não deixa o site pedir a sua localização.
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: brand.purple }}>
        {android ? 'Abra no Chrome e toque em "Perto de mim" de novo.' : 'Toque em ••• (ou no ícone de compartilhar) e escolha "Abrir no Safari"; depois toque em "Perto de mim" de novo.'}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 1 }}>
        {android && (
          <Button size="small" variant="contained" href={openInChromeUrl()} sx={{ borderRadius: 99, fontWeight: 800 }}>
            Abrir no Chrome
          </Button>
        )}
        <Button size="small" variant={android ? 'outlined' : 'contained'} onClick={copy} sx={{ borderRadius: 99, fontWeight: 800 }}>
          {copied ? 'Endereço copiado' : 'Copiar endereço'}
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: brand.plum }}>
        Sem localização, é só buscar o pico acima ou escolher o estado na lista.
      </Typography>
    </Box>
  )
}


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
  /** "Perto de mim": picos até 10 km (ou os 3 mais próximos, se não houver nenhum) */
  const [nearby, setNearby] = useState<{ within: boolean; list: { spot: Spot; km: number }[] } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // no celular a tela de início é só a lista (o mapa nem carrega)
  const showMap = useMediaQuery(useTheme().breakpoints.up('md'), {
    noSsr: true,
  })
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
      'Previsão de ondas de 14 dias, grátis, para surf e bodyboard em SC, SP, RJ, ES, BA, AL, PE, CE e AP: Florianópolis, Garopaba, Ubatuba, Maresias, Guarujá, Saquarema, Arpoador, Búzios, Itaúnas, Regência, Maceió, Salvador, Itacaré, Praia do Francês, Porto de Galinhas, Maracaípe, Paracuru, Jericoacoara e mais. Swell, vento, maré e tempo.',
    path: '/',
  })

  const go = (s: Spot | null) => s && navigate(`/pico/${s.id}`)
  const setLevel = (next: { uf?: string | null; cidade?: string | null }) => {
    setNearby(null)
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
    if (nearby)
      return nearby.list.map(({ spot: s }) => ({
        type: 'spot',
        spot: s,
        active: s.id === savedId,
        onClick: () => go(s),
      }))
    if (!uf)
      return allStates.map((pl) => ({
        type: 'place',
        place: pl,
        onClick: () => setLevel({ uf: pl.key }),
      }))
    if (!city)
      return cityList.map((pl) => ({
        type: 'place',
        place: pl,
        onClick: () => setLevel({ uf, cidade: pl.key }),
      }))
    return spotList.map((s) => ({
      type: 'spot',
      spot: s,
      active: s.id === savedId,
      onClick: () => go(s),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uf, city, cityList, spotList, allStates, savedId, nearby])

  // links antigos (/?pico=…) continuam funcionando
  const legacy = params.get('pico')
  if (legacy && SPOTS.some((s) => s.id === legacy)) return <Navigate to={`/pico/${legacy}`} replace />

  const nearMe = async () => {
    setGeoError(null)
    setLocating(true)
    const r = await getPosition()
    setLocating(false)
    if (!r.ok) {
      if (r.reason === 'inapp') {
        setGeoError(`inapp:${inAppBrowser() ?? 'app'}`)
        return
      }
      setGeoError(
        r.reason === 'unsupported'
          ? 'Este navegador não informa a localização.'
          : r.reason === 'denied'
            ? 'A localização está bloqueada. Libere o acesso ao site nos ajustes do navegador e toque de novo.'
            : 'Não foi possível descobrir sua localização agora. Tente de novo.',
      )
      return
    }
    const all = SPOTS.map((spot) => ({ spot, km: distanceKm(r.lat, r.lon, spot.lat, spot.lon) })).sort((a, b) => a.km - b.km)
    const within = all.filter((x) => x.km <= 10)
    setNearby(within.length ? { within: true, list: within } : { within: false, list: all.slice(0, 3) })
    // no celular a lista fica abaixo: rola até ela
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`)

  const title = nearby ? (nearby.within ? 'Perto de você · até 10 km' : 'Mais perto de você') : !uf ? 'Escolha o estado' : !city ? 'Escolha a cidade' : 'Escolha o pico'
  const back = nearby ? () => setNearby(null) : city ? () => setLevel({ uf }) : uf && !singleState ? () => setLevel({}) : null

  return (
    <Stack spacing={3}>
      {/* destaque */}
      <Box sx={{ textAlign: 'center', pt: { xs: 0, md: 3 } }}>
        {/* logo e selo dos 14 dias na mesma linha, centralizados verticalmente */}
        <Stack
          direction="row"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: 2.5,
            rowGap: 1.5,
            mb: { xs: 1.5, md: 2 },
          }}
        >
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Wordmark height={48} />
          </Box>
          {/* destaque: 14 dias grátis */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
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
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 99,
                bgcolor: brand.green,
                color: '#fff',
                fontSize: { xs: 12, md: 13 },
              }}
            >
              14 dias
            </Box>
            de previsão, 100% grátis
          </Box>
        </Stack>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 26, md: 40 } }}>
          Onde você vai cair hoje?
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          sx={{
            justifyContent: 'center',
            alignItems: 'stretch',
            mt: { xs: 2, md: 2.5 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: { sm: 420 } }}>
            <SpotPicker value={null} onChange={go} allowEmpty locate={false} placeholder="Buscar praia ou pico" width="100%" />
          </Box>
          <Button
            variant="outlined"
            onClick={nearMe}
            disabled={locating}
            startIcon={<Position width={18} height={18} />}
            sx={{
              borderRadius: 99,
              whiteSpace: 'nowrap',
              bgcolor: 'background.paper',
              minHeight: 44,
            }}
          >
            Perto de mim
          </Button>
        </Stack>
        {geoError?.startsWith('inapp:') ? (
          <InAppHelp app={geoError.slice(6)} />
        ) : (
          geoError && (
            <Typography variant="body2" sx={{ mt: 1.25, color: brand.plum, fontWeight: 700 }}>
              {geoError}
            </Typography>
          )
        )}
        {last && (
          <Button
            onClick={() => go(last)}
            endIcon={<ArrowRight width={16} height={16} />}
            sx={{
              mt: 1.25,
              borderRadius: 99,
              fontWeight: 800,
              maxWidth: '100%',
              '& .MuiButton-endIcon': { flexShrink: 0 },
            }}
          >
            <Box
              component="span"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Continuar em {last.name} · {last.city}
            </Box>
          </Button>
        )}
      </Box>

      {/* mapa + lista do nível atual */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0,1fr)',
            md: 'minmax(0,2fr) minmax(0,1fr)',
          },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {showMap && <HomeMap items={items} height={MAP_H} />}

        <Paper
          ref={panelRef}
          sx={{
            scrollMarginTop: 80,
            p: { xs: 2, sm: 2.5 },
            maxHeight: { md: MAP_H },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Breadcrumbs sx={{ fontSize: 13, mb: 0.5 }}>
            {!singleState && (
              <Link component="button" underline="hover" color="inherit" onClick={() => setLevel({})}>
                Brasil
              </Link>
            )}
            {uf && (
              <Link component="button" underline="hover" color="inherit" onClick={() => setLevel({ uf })}>
                {singleState ? `Litoral de ${STATE_NAMES[uf] ?? uf}` : (STATE_NAMES[uf] ?? uf)}
              </Link>
            )}
            {city && !nearby && <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{city}</Typography>}
            {nearby && <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Perto de mim</Typography>}
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
            {nearby && !nearby.within && (
              <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                Nenhum pico até 10 km de você. Estes são os mais próximos:
              </Typography>
            )}
            {nearby &&
              nearby.list.map(({ spot: s, km }) => (
                <Row key={s.id} title={s.name} sub={`${s.city} · ${fmtKm(km)}`} onClick={() => go(s)} active={s.id === savedId} />
              ))}
            {!nearby && !uf &&
              allStates.map((pl) => (
                <Row key={pl.key} title={pl.name} sub={`${pl.count} picos`} onClick={() => setLevel({ uf: pl.key })} />
              ))}
            {!nearby &&
              uf &&
              !city &&
              cityList.map((pl) => (
                <Row
                  key={pl.key}
                  title={pl.name}
                  sub={`${pl.count} ${pl.count === 1 ? 'pico' : 'picos'}`}
                  onClick={() => setLevel({ uf, cidade: pl.key })}
                />
              ))}
            {!nearby &&
              city &&
              spotList.map((s) => (
                <Row
                  key={s.id}
                  title={s.name}
                  sub={`${KIND_LABEL[s.kind]} · ${dirDeg(s.facing)}`}
                  onClick={() => go(s)}
                  active={s.id === savedId}
                />
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
