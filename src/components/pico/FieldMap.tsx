import { Box, CircularProgress, Typography } from '@mui/material'
import type { GeoJSONSource, ImageSource, Map as MLMap, Marker as MLMarker, StyleSpecification } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import type { Bbox, Grid } from '../../api/grid'
import type { Spot } from '../../data/spots'
import { directionPoints, drawField, type FieldDef } from '../../lib/fields'
import { arrowImage, loadMapLibre, OFM_GLYPHS, OFM_SOURCE } from '../../lib/maplibre'
import { brand } from '../../theme'

const EMPTY = { type: 'FeatureCollection' as const, features: [] }
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const corners = (b: Bbox): [[number, number], [number, number], [number, number], [number, number]] => [
  [b.west, b.north],
  [b.east, b.north],
  [b.east, b.south],
  [b.west, b.south],
]

function style(b: Bbox): StyleSpecification {
  return {
    version: 8,
    glyphs: OFM_GLYPHS,
    sources: {
      ofm: OFM_SOURCE,
      field: { type: 'image', url: BLANK, coordinates: corners(b) },
      arrows: { type: 'geojson', data: EMPTY },
    },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': '#EDE5D8' } },
      { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': '#D5E8E1' } },
      { id: 'field', type: 'raster', source: 'field', paint: { 'raster-opacity': 0.88, 'raster-fade-duration': 0, 'raster-resampling': 'linear' } },
      {
        id: 'borders',
        type: 'line',
        source: 'ofm',
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 4],
        paint: { 'line-color': '#3B2A40', 'line-opacity': 0.45, 'line-width': ['match', ['get', 'admin_level'], 2, 1.2, 0.7] },
      },
      {
        id: 'cities',
        type: 'symbol',
        source: 'ofm',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 11 },
        paint: { 'text-color': '#2A1F2E', 'text-halo-color': 'rgba(255,255,255,.8)', 'text-halo-width': 1.2 },
      },
    ],
  }
}

/** Mapa de um campo em grade (altura, vento, temperatura…) com setas de direção e o pico marcado. */
export function FieldMap({
  grid,
  bbox,
  def,
  timeIndex,
  spot,
  loading,
  error,
  height = 360,
  label,
}: {
  grid: Grid | null
  bbox: Bbox
  def: FieldDef
  timeIndex: number
  spot: Spot
  loading: boolean
  error?: string | null
  height?: number | { xs: number; md: number }
  label?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const marker = useRef<MLMarker | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let created: MLMap | null = null
    loadMapLibre()
      .then((ml) => {
        if (cancelled || !ref.current) return
        try {
          created = new ml.Map({
            container: ref.current,
            style: style(bbox),
            // centro/zoom simples; o enquadramento exato é feito depois que o quadro tem tamanho final
            center: [(bbox.west + bbox.east) / 2, (bbox.north + bbox.south) / 2],
            zoom: 5,
            interactive: false,
            attributionControl: false,
            fadeDuration: 0,
          })
        } catch {
          setFailed(true)
          return
        }
        map.current = created
        const el = document.createElement('div')
        el.className = 'olhaonda-field-pin'
        marker.current = new ml.Marker({ element: el }).setLngLat([spot.lon, spot.lat]).addTo(created)
        // enquadra a região PREENCHENDO o quadro (sem faixas vazias nas laterais)
        const fit = () => {
          if (!created) return
          created.resize()
          created.fitBounds(
            [
              [bbox.west, bbox.south],
              [bbox.east, bbox.north],
            ],
            { padding: 0, duration: 0 },
          )
          const nw = created.project([bbox.west, bbox.north])
          const se = created.project([bbox.east, bbox.south])
          const c = created.getContainer()
          const scale = Math.max(c.clientWidth / Math.max(1, se.x - nw.x), c.clientHeight / Math.max(1, se.y - nw.y))
          if (scale > 1.01) created.setZoom(created.getZoom() + Math.log2(scale))
        }
        created.once('load', () => {
          if (cancelled || !created) return
          fit()
          created.addImage('field-arrow', arrowImage(), { sdf: true, pixelRatio: 2 })
          created.addLayer(
            {
              id: 'arrows',
              type: 'symbol',
              source: 'arrows',
              layout: {
                'icon-image': 'field-arrow',
                'icon-size': 0.42,
                'icon-rotate': ['get', 'r'],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
              },
              paint: { 'icon-color': '#1E1424', 'icon-opacity': 0.7, 'icon-halo-color': 'rgba(255,255,255,.7)', 'icon-halo-width': 1 },
            },
            'borders',
          )
          setReady(true)
        })
        // o quadro muda de tamanho (layout responsivo): reenquadra
        const ro = new ResizeObserver(() => fit())
        if (ref.current) ro.observe(ref.current)
        created.once('remove', () => ro.disconnect())
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      created?.remove()
      map.current = null
      marker.current = null
      setReady(false)
    }
    // recria só se a região mudar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bbox.west, bbox.south, bbox.east, bbox.north])

  useEffect(() => {
    marker.current?.setLngLat([spot.lon, spot.lat])
  }, [spot.lat, spot.lon])

  // pinta o campo e as setas da hora escolhida
  useEffect(() => {
    const m = map.current
    if (!m || !ready || !grid) return
    const t = Math.max(0, Math.min(grid.times.length - 1, timeIndex))
    ;(m.getSource('field') as ImageSource | undefined)?.updateImage({ url: drawField(grid, def, t), coordinates: corners(grid.bbox) })
    ;(m.getSource('arrows') as GeoJSONSource | undefined)?.setData(directionPoints(grid, def, t))
  }, [grid, def, timeIndex, ready])

  return (
    <Box sx={{ position: 'relative', height, borderRadius: '14px', overflow: 'hidden', bgcolor: '#EDE5D8' }}>
      {!failed && (
        <Box
          ref={ref}
          sx={{
            position: 'absolute',
            inset: 0,
            // o CSS do MapLibre força position: relative; largura/altura explícitas evitam o colapso
            width: '100%',
            height: '100%',
            '& .olhaonda-field-pin': {
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: brand.purple,
              border: `3px solid ${brand.sand}`,
              boxShadow: '0 2px 8px rgba(75,29,90,.4)',
            },
          }}
        />
      )}
      {(loading || !ready) && !error && !failed && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <CircularProgress size={28} sx={{ color: brand.deepGreen }} />
        </Box>
      )}
      {(error || failed) && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {error ?? 'Seu navegador não conseguiu desenhar o mapa.'}
          </Typography>
        </Box>
      )}
      {label && (
        <Box
          sx={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            px: 1,
            py: 0.25,
            borderRadius: '8px',
            bgcolor: 'rgba(251,244,236,.92)',
            fontSize: 12,
            fontWeight: 800,
            color: brand.purple,
            pointerEvents: 'none',
          }}
        >
          {label}
        </Box>
      )}
    </Box>
  )
}
