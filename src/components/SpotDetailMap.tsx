import { Box, Typography } from '@mui/material'
import type { GeoJSONSource, Map as MLMap, Marker as MLMarker, StyleSpecification } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'
import { loadMapLibre, OFM_ATTRIBUTION, OFM_GLYPHS, OFM_SOURCE, offsetLngLat, snapToCoast } from '../lib/maplibre'
import { dirDeg, fmt } from '../lib/surf'
import { brand } from '../theme'

/**
 * Mapa detalhado do pico (card "O pico"): terra, vegetação, prédios, ruas e nomes,
 * com as cristas do swell chegando na direção prevista para a hora selecionada.
 * As cristas andam no ritmo real: avançam um comprimento de onda a cada período.
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
      id: 'waves',
      type: 'line',
      source: 'waves',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': brand.deepGreen,
        'line-width': ['get', 'w'],
        'line-opacity': ['get', 'o'],
        'line-blur': 0.4,
      },
    },
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
const viewCenter = (p: { lat: number; lon: number }, facing: number) => offset(p.lat, p.lon, facing, 700)
const offset = offsetLngLat

/**
 * Cristas paralelas, perpendiculares à direção do swell, vindo do mar até ~200 m do pico.
 * `phase` (0–1) desloca as cristas em direção à costa.
 */
function waveCrests(spot: { lat: number; lon: number }, fromDeg: number, heightM: number, periodS: number, phase: number) {
  const L = Math.min(420, Math.max(160, 1.56 * periodS * periodS)) // comprimento de onda em águas profundas (m)
  const maxDist = 2600
  const minDist = 120 // as cristas morrem ~120 m antes da areia
  const halfWidth = 900
  const features = []
  for (let k = 0; ; k++) {
    const d = minDist + (k + 1 - phase) * L
    if (d > maxDist) break
    const center = offset(spot.lat, spot.lon, fromDeg, d)
    const coords: [number, number][] = []
    // crista levemente curva (refração perto da costa)
    for (let i = -10; i <= 10; i++) {
      const t = i / 10
      const along = offset(center[1], center[0], fromDeg + 90, t * halfWidth)
      const bend = offset(along[1], along[0], fromDeg, t * t * 160 * (1 - d / maxDist))
      coords.push(bend)
    }
    // some ao chegar perto da praia e ao surgir lá fora
    const near = Math.min(1, (d - minDist) / L)
    const far = Math.min(1, (maxDist - d) / (L * 1.5))
    features.push({
      type: 'Feature' as const,
      properties: { o: 0.75 * near * far, w: Math.min(4, 1.2 + heightM * 1.1) },
      geometry: { type: 'LineString' as const, coordinates: coords },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

export function SpotDetailMap({ spot, hour }: { spot: Spot; hour: HourPoint }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const marker = useRef<MLMarker | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  // valores atuais lidos pela animação (que roda fora do ciclo do React)
  const swell = useRef({ dir: 0, h: 0, t: 10 })
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
  useEffect(() => {
    swell.current = { dir: dir ?? spot.facing, h: height, t: period }
    spotRef.current = spot
  }, [dir, height, period, spot])

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
          const { dir: d, h, t } = swell.current
          const phase = reduce ? 0.5 : (((now - start) / 1000) % t) / t
          src.setData(waveCrests(coastRef.current ?? spotRef.current, d, h, t, phase))
        }
        created.once('load', () => {
          if (cancelled) return
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
      {dir != null && (
        <Box
          sx={{
            position: 'absolute',
            left: 10,
            top: 10,
            px: 1.25,
            py: 0.5,
            borderRadius: 99,
            bgcolor: 'rgba(251,244,236,.92)',
            fontSize: 12,
            fontWeight: 800,
            color: brand.deepGreen,
            pointerEvents: 'none',
          }}
        >
          Swell {dirDeg(dir)} · {fmt.m(height)} · {fmt.s(period)}
        </Box>
      )}
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
