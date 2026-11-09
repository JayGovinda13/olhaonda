import { Box, Typography } from '@mui/material'
import type { GeoJSONSource, Map as MLMap, Marker as MLMarker, StyleSpecification } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { loadMapLibre, OFM_ATTRIBUTION, OFM_GLYPHS, OFM_SOURCE, offsetLngLat, snapToCoast } from '../lib/maplibre'
import { dirDeg, ENERGY_GRADIENT, energyColor, energyLabel, energyRatio, fmt, fmtEnergy, waveEnergy } from '../lib/surf'
import { brand } from '../theme'

/**
 * Mapa detalhado do pico (card "O pico"): terra, vegetação, prédios, ruas e nomes,
 * com setas do swell chegando na direção prevista para a hora selecionada.
 * As setas andam no ritmo real (um comprimento de onda a cada período) e a cor mostra a força.
 */

const C = {
  water: '#CFE6DC',
  land: '#F6ECDF',
  green: '#E2E8CC',
  building: '#E9DACA',
  road: '#FFFFFF',
  roadCase: 'rgba(75,29,90,.18)',
  label: brand.purple,
}

const STYLE: StyleSpecification = {
  version: 8,
  glyphs: OFM_GLYPHS,
  sources: { ofm: OFM_SOURCE, waves: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } },
  layers: [
    { id: 'land', type: 'background', paint: { 'background-color': C.land } },
    {
      id: 'landcover',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'wetland', 'farmland']]],
      paint: { 'fill-color': C.green, 'fill-opacity': 0.8 },
    },
    {
      id: 'park',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'park',
      paint: { 'fill-color': C.green, 'fill-opacity': 0.6 },
    },
    {
      id: 'sand',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'sand'],
      paint: { 'fill-color': '#F1DFC2' },
    },
    { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': C.water } },
    {
      id: 'building',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'building',
      minzoom: 13,
      paint: { 'fill-color': C.building },
    },
    {
      id: 'road-case',
      type: 'line',
      source: 'ofm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.roadCase, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.2, 16, 9] },
    },
    {
      id: 'road',
      type: 'line',
      source: 'ofm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.road, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 16, 7] },
    },
    {
      id: 'water-name',
      type: 'symbol',
      source: 'ofm',
      'source-layer': 'water_name',
      layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Italic'], 'text-size': 12 },
      paint: { 'text-color': brand.deepGreen, 'text-halo-color': C.water, 'text-halo-width': 1.2 },
    },
    {
      id: 'place',
      type: 'symbol',
      source: 'ofm',
      'source-layer': 'place',
      filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'village', 'suburb', 'neighbourhood', 'island']]],
      layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-max-width': 8 },
      paint: { 'text-color': C.label, 'text-halo-color': C.land, 'text-halo-width': 1.5, 'text-opacity': 0.85 },
    },
  ],
}

const ZOOM = 13.2

/** Centro do mapa ~700 m mar adentro: o pico fica perto da borda e as ondas chegando ganham espaço. */
const viewCenter = (p: { lat: number; lon: number }, facing: number) => offsetLngLat(p.lat, p.lon, facing, 700)

/**
 * Setas do swell: faixas paralelas vindo do mar até ~120 m do pico, apontando para onde a onda vai.
 * `phase` (0–1) avança as setas em direção à costa; `color` é a cor da força (energia).
 */
function swellArrows(
  base: { lat: number; lon: number },
  fromDeg: number,
  heightM: number,
  periodS: number,
  phase: number,
  color: string,
) {
  const L = Math.min(420, Math.max(160, 1.56 * periodS * periodS)) // comprimento de onda em águas profundas (m)
  const step = Math.max(L * 1.6, 420) // espaço entre setas na mesma faixa
  const maxDist = 2600
  const minDist = 120
  const lanes = [-2, -1, 0, 1, 2]
  const laneGap = 360 // m entre faixas
  const toward = (fromDeg + 180) % 360
  const size = Math.min(1.1, 0.5 + heightM * 0.22)
  const features = []
  for (const lane of lanes) {
    const stagger = Math.abs(lane) % 2 ? 0.5 : 0
    for (let k = 0; ; k++) {
      const d = minDist + (k + 1 - phase + stagger) * step
      if (d > maxDist) break
      const onLine = offsetLngLat(base.lat, base.lon, fromDeg, d)
      const p = offsetLngLat(onLine[1], onLine[0], fromDeg + 90, lane * laneGap)
      const near = Math.min(1, (d - minDist) / step) // some ao chegar na praia
      const far = Math.min(1, (maxDist - d) / (step * 1.5)) // surge lá fora
      const edge = 1 - Math.abs(lane) / (lanes.length / 2 + 1) // faixas das pontas mais suaves
      features.push({
        type: 'Feature' as const,
        properties: { o: 0.95 * near * far * (0.45 + 0.55 * edge), s: size * (1 + 0.2 * (1 - d / maxDist)), r: toward, c: color },
        geometry: { type: 'Point' as const, coordinates: p },
      })
    }
  }
  return { type: 'FeatureCollection' as const, features }
}

/** Seta (apontando para o norte) desenhada em canvas, usada como ícone SDF para poder colorir. */
function arrowImage() {
  const S = 64
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.beginPath()
  g.moveTo(S / 2, 4) // ponta
  g.lineTo(S - 12, 30)
  g.lineTo(S / 2 + 7, 26)
  g.lineTo(S / 2 + 7, S - 6)
  g.lineTo(S / 2 - 7, S - 6)
  g.lineTo(S / 2 - 7, 26)
  g.lineTo(12, 30)
  g.closePath()
  g.fill()
  return g.getImageData(0, 0, S, S)
}

export function SpotDetailMap({ spot, hour }: { spot: Spot; hour: HourPoint }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const marker = useRef<MLMarker | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  // valores atuais lidos pela animação (que roda fora do ciclo do React)
  const swell = useRef<{ dir: number; h: number; t: number; c: string }>({ dir: 0, h: 0, t: 10, c: brand.deepGreen })
  const spotRef = useRef(spot)
  /** Ponto do pico na linha da costa (calculado depois que o mapa desenha). */
  const coastRef = useRef<{ lat: number; lon: number } | null>(null)

  const placeOnCoast = () => {
    const m = map.current
    if (!m) return
    coastRef.current = null
    m.once('idle', () => {
      const sp = spotRef.current
      const c = snapToCoast(m, sp)
      if (!c) return
      coastRef.current = { lon: c[0], lat: c[1] }
      marker.current?.setLngLat(c)
      m.easeTo({ center: viewCenter(coastRef.current, sp.facing), duration: 300 })
    })
  }

  const dir = hour.swellDirection ?? hour.waveDirection
  const period = hour.swellPeakPeriod ?? hour.swellPeriod ?? hour.wavePeriod ?? 10
  const height = hour.swellHeight ?? hour.waveHeight ?? 0
  const energy = waveEnergy(hour)
  const color = energyColor(energy)
  useEffect(() => {
    swell.current = { dir: dir ?? spot.facing, h: height, t: period, c: color }
    spotRef.current = spot
  }, [dir, height, period, color, spot])

  useEffect(() => {
    let cancelled = false
    let created: MLMap | null = null
    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    if (ref.current) io.observe(ref.current)

    loadMapLibre()
      .then((ml) => {
        if (cancelled || !ref.current) return
        try {
          created = new ml.Map({
            container: ref.current,
            style: STYLE,
            center: viewCenter(spot, spot.facing),
            zoom: ZOOM,
            attributionControl: false,
            cooperativeGestures: true, // rolar a página não dá zoom sem querer
            dragRotate: false,
            pitchWithRotate: false,
          })
        } catch {
          setFailed(true)
          return
        }
        map.current = created
        created.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
        const el = document.createElement('div')
        el.className = 'olhaonda-detail-pin'
        marker.current = new ml.Marker({ element: el }).setLngLat([spot.lon, spot.lat]).addTo(created)

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const start = performance.now()
        let last = 0
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick)
          if (!visible || now - last < 33) return // ~30 fps e só quando visível
          last = now
          const src = created?.getSource('waves') as GeoJSONSource | undefined
          if (!src) return
          const { dir: d, h, t, c } = swell.current
          const phase = reduce ? 0.5 : (((now - start) / 1000) % t) / t
          src.setData(swellArrows(coastRef.current ?? spotRef.current, d, h, t, phase, c))
        }
        created.once('load', () => {
          if (cancelled || !created) return
          // setas do swell: ícone SDF colorido pela força, girado para onde a onda vai
          created.addImage('swell-arrow', arrowImage(), { sdf: true, pixelRatio: 2 })
          created.addLayer(
            {
              id: 'swell-arrows',
              type: 'symbol',
              source: 'waves',
              layout: {
                'icon-image': 'swell-arrow',
                'icon-size': ['get', 's'],
                'icon-rotate': ['get', 'r'],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
              },
              paint: {
                'icon-color': ['get', 'c'],
                'icon-opacity': ['get', 'o'],
                'icon-halo-color': 'rgba(251,244,236,.9)',
                'icon-halo-width': 1,
              },
            },
            'building',
          )
          setReady(true)
          raf = requestAnimationFrame(tick)
        })
        placeOnCoast()
      })
      .catch(() => setFailed(true))

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      io.disconnect()
      created?.remove()
      map.current = null
      marker.current = null
    }
    // o mapa é criado uma vez; troca de pico tratada abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map.current) return
    map.current.easeTo({ center: viewCenter(spot, spot.facing), zoom: ZOOM, duration: 900 })
    marker.current?.setLngLat([spot.lon, spot.lat])
    placeOnCoast()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot])

  if (failed) return null

  return (
    <Box sx={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: { xs: 260, md: 300 }, bgcolor: C.water }}>
      <Box
        ref={ref}
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: ready ? 1 : 0,
          transition: 'opacity .6s ease',
          '& .olhaonda-detail-pin': {
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: brand.purple,
            border: `3px solid ${brand.sand}`,
            boxShadow: '0 2px 8px rgba(75,29,90,.35)',
          },
          '& .maplibregl-ctrl-group': { borderRadius: '10px', boxShadow: 'none', border: '1px solid rgba(75,29,90,.15)' },
        }}
      />
      {/* resumo do swell + legenda da força (cor das setas) */}
      <Box
        sx={{
          position: 'absolute',
          left: 10,
          bottom: 24,
          px: 1.25,
          py: 0.75,
          borderRadius: '10px',
          bgcolor: 'rgba(251,244,236,.92)',
          pointerEvents: 'none',
          width: 186,
        }}
      >
        {dir != null && (
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: brand.deepGreen }}>
            Swell {dirDeg(dir)} · {fmt.m(height)} · {fmt.s(period)}
          </Typography>
        )}
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: brand.purple }}>
          Força: {fmtEnergy(energy)} · {energyLabel(energy)}
        </Typography>
        <Box sx={{ position: 'relative', height: 6, borderRadius: 3, background: ENERGY_GRADIENT, mt: 0.5 }}>
          <Box
            sx={{
              position: 'absolute',
              top: -3,
              left: `calc(${energyRatio(energy) * 100}% - 6px)`,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: color,
              border: `2px solid ${brand.sand}`,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
          <Typography sx={{ fontSize: 9, opacity: 0.6 }}>fraca</Typography>
          <Typography sx={{ fontSize: 9, opacity: 0.6 }}>pesada</Typography>
        </Box>
      </Box>
      <Typography
        component="a"
        href="https://openfreemap.org"
        target="_blank"
        rel="noopener"
        sx={{
          position: 'absolute',
          right: 8,
          bottom: 4,
          fontSize: 10,
          color: brand.purple,
          opacity: 0.6,
          textDecoration: 'none',
          bgcolor: 'rgba(251,244,236,.8)',
          px: 0.75,
          borderRadius: 1,
        }}
      >
        {OFM_ATTRIBUTION}
      </Typography>
    </Box>
  )
}
