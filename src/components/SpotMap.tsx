import { Box, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import type { Map as MLMap, Marker as MLMarker, StyleSpecification } from 'maplibre-gl'
import type { Spot } from '../data/spots'
import { loadMapLibre, OFM_ATTRIBUTION, OFM_SOURCE, snapToCoast } from '../lib/maplibre'
import { brand } from '../theme'

/**
 * Mapa da região do pico, usado como marca d'água no fundo do card principal.
 *
 * Vetores da OpenFreeMap (gratuito, sem chave, liberado para uso comercial) renderizados
 * pelo MapLibre, com um estilo mínimo nos tons do card: só terra, água e ruas
 * principais bem apagadas. O MapLibre é carregado sob demanda para não atrasar a previsão.
 */

// sem linha de costa: contorno de polígono desenharia as bordas de cada tile
const WATER = '#08342A'
const LAND = '#1A6A4E'

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    ofm: OFM_SOURCE,
  },
  layers: [
    { id: 'land', type: 'background', paint: { 'background-color': LAND } },
    { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': WATER } },
    // só o oceano (invisível): usado para achar a linha da costa sem confundir com piscinas, lagos e rios
    {
      id: 'ocean-query',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'water',
      filter: ['==', ['get', 'class'], 'ocean'],
      paint: { 'fill-opacity': 0 },
    },
    {
      id: 'roads',
      type: 'line',
      source: 'ofm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]],
      paint: { 'line-color': brand.sand, 'line-opacity': 0.14, 'line-width': 0.8 },
    },
  ],
}

const ZOOM = 12.2

export function SpotMap({ spot }: { spot: Spot }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const marker = useRef<MLMarker | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const spotRef = useRef(spot)

  /** Depois que os tiles do pico desenham, põe o marcador (e o centro) na linha da costa. */
  const placeOnCoast = () => {
    const m = map.current
    if (!m) return
    m.once('idle', () => {
      const coast = snapToCoast(m, spotRef.current)
      if (!coast) return
      marker.current?.setLngLat(coast)
      m.jumpTo({ center: coast })
    })
  }

  // cria o mapa uma vez (carregando o MapLibre sob demanda)
  useEffect(() => {
    let cancelled = false
    let created: MLMap | null = null
    loadMapLibre()
      .then((ml) => {
        if (cancelled || !ref.current) return
        try {
          created = new ml.Map({
            container: ref.current,
            style: STYLE,
            center: [spot.lon, spot.lat],
            zoom: ZOOM,
            interactive: false,
            attributionControl: false,
            fadeDuration: 0,
          })
        } catch {
          setFailed(true) // sem WebGL: o card segue sem mapa
          return
        }
        map.current = created
        // o pico fica na metade direita, longe dos números do card
        const pad = () => {
          const w = ref.current?.clientWidth ?? 0
          const h = ref.current?.clientHeight ?? 0
          // celular: canto superior direito (acima das estatísticas); desktop: metade direita
          created?.setPadding(w < 600 ? { left: w * 0.45, top: 0, right: 0, bottom: h * 0.62 } : { left: w * 0.45, top: 0, right: 0, bottom: 0 })
        }
        pad()
        created.jumpTo({ center: [spot.lon, spot.lat] })
        created.on('resize', pad)
        created.once('load', () => !cancelled && setReady(true))

        const el = document.createElement('div')
        el.className = 'olhaonda-pin'
        marker.current = new ml.Marker({ element: el }).setLngLat([spot.lon, spot.lat]).addTo(created)
        placeOnCoast()
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      created?.remove()
      map.current = null
      marker.current = null
    }
    // o mapa é criado uma vez; a troca de pico é tratada no efeito abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // troca de pico: move o mapa e o marcador, depois ajusta para a costa
  useEffect(() => {
    spotRef.current = spot
    const m = map.current
    if (!m) return
    m.easeTo({ center: [spot.lon, spot.lat], zoom: ZOOM, duration: 900 })
    marker.current?.setLngLat([spot.lon, spot.lat])
    placeOnCoast()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot])

  if (failed) return null

  return (
    <>
      <Box
        ref={ref}
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: ready ? 0.7 : 0,
          transition: 'opacity .8s ease',
          // some à esquerda para não competir com os números
          maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,.25) 30%, #000 65%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,.25) 30%, #000 65%)',
          '@media (max-width: 600px)': {
            maskImage: 'linear-gradient(200deg, #000 15%, rgba(0,0,0,.3) 50%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(200deg, #000 15%, rgba(0,0,0,.3) 50%, transparent 80%)',
          },
          '& canvas': { outline: 'none' },
          '& .olhaonda-pin': {
            width: 14,
            height: 14,
            borderRadius: '50%',
            bgcolor: brand.sand,
            border: `3px solid ${brand.green}`,
            boxShadow: `0 0 0 0 ${brand.green}`,
            animation: 'olhaondaPulse 2.4s ease-out infinite',
          },
          '@keyframes olhaondaPulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(47,174,123,.7)' },
            '100%': { boxShadow: '0 0 0 22px rgba(47,174,123,0)' },
          },
          '@media (prefers-reduced-motion: reduce)': { '& .olhaonda-pin': { animation: 'none' } },
        }}
      />
      {ready && (
        <Typography
          component="a"
          href="https://openfreemap.org"
          target="_blank"
          rel="noopener"
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 8,
            zIndex: 1,
            fontSize: 10,
            color: brand.sand,
            opacity: 0.45,
            textDecoration: 'none',
            '&:hover': { opacity: 0.8 },
          }}
        >
          {OFM_ATTRIBUTION}
        </Typography>
      )}
    </>
  )
}
