import { Box, CircularProgress } from '@mui/material'
import type { GeoJSONSource, Map as MLMap, Marker as MLMarker, StyleSpecification } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { bounds, type Place } from '../../data/hierarchy'
import type { Spot } from '../../data/spots'
import { loadMapLibre, OFM_ATTRIBUTION, OFM_GLYPHS, OFM_SOURCE } from '../../lib/maplibre'
// mapa sempre no tema claro (MapLibre não lê variáveis CSS)
import { fixed as brand } from '../../theme'

const STYLE: StyleSpecification = {
  version: 8,
  glyphs: OFM_GLYPHS,
  sources: { ofm: OFM_SOURCE },
  layers: [
    { id: 'land', type: 'background', paint: { 'background-color': '#F6ECDF' } },
    {
      id: 'green',
      type: 'fill',
      source: 'ofm',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'wetland']]],
      paint: { 'fill-color': '#E2E8CC', 'fill-opacity': 0.8 },
    },
    { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': '#CFE6DC' } },
    {
      id: 'roads',
      type: 'line',
      source: 'ofm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
      paint: { 'line-color': '#FFFFFF', 'line-width': 1.2 },
    },
    {
      id: 'borders',
      type: 'line',
      source: 'ofm',
      'source-layer': 'boundary',
      filter: ['<=', ['get', 'admin_level'], 4],
      paint: { 'line-color': brand.purple, 'line-opacity': 0.25, 'line-width': 1 },
    },
  ],
}

export type MapItem =
  | { type: 'place'; place: Place; onClick: () => void }
  | { type: 'spot'; spot: Spot; onClick: () => void; active?: boolean }

/** Mapa da tela de início: mostra estados, cidades ou picos e enquadra o nível atual. */
export function HomeMap({ items, height }: { items: MapItem[]; height: number | { xs: number; md: number } }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const ml = useRef<typeof import('maplibre-gl') | null>(null)
  const markers = useRef<MLMarker[]>([])
  /** cliques dos picos (camada do mapa), por id */
  const spotClicks = useRef(new Map<string, () => void>())
  const declutterRef = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let created: MLMap | null = null
    loadMapLibre()
      .then((lib) => {
        if (cancelled || !ref.current) return
        ml.current = lib
        try {
          created = new lib.Map({
            container: ref.current,
            style: STYLE,
            center: [-46.4, -24.05],
            zoom: 9,
            attributionControl: false,
            cooperativeGestures: true,
            dragRotate: false,
            pitchWithRotate: false,
          })
        } catch {
          setFailed(true)
          return
        }
        created.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right')
        map.current = created
        created.once('load', () => {
          if (cancelled || !created) return
          // picos como camadas do mapa: o MapLibre esconde os nomes que colidiriam
          created.addSource('spots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
          created.addLayer({
            id: 'spot-dots',
            type: 'circle',
            source: 'spots',
            paint: {
              'circle-radius': 7,
              'circle-color': ['case', ['get', 'active'], brand.green, brand.purple],
              'circle-stroke-color': brand.sand,
              'circle-stroke-width': 2.5,
            },
          })
          created.addLayer({
            id: 'spot-labels',
            type: 'symbol',
            source: 'spots',
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Noto Sans Bold'],
              'text-size': 12,
              'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
              'text-radial-offset': 0.9,
              'text-justify': 'auto',
            },
            paint: { 'text-color': brand.purple, 'text-halo-color': 'rgba(251,244,236,.95)', 'text-halo-width': 2 },
          })
          const hit = (e: { features?: { properties: Record<string, unknown> }[] }) => {
            const id = e.features?.[0]?.properties.id as string | undefined
            if (id) spotClicks.current.get(id)?.()
          }
          for (const l of ['spot-dots', 'spot-labels']) {
            created.on('click', l, hit)
            created.on('mouseenter', l, () => created && (created.getCanvas().style.cursor = 'pointer'))
            created.on('mouseleave', l, () => created && (created.getCanvas().style.cursor = ''))
          }
          setReady(true)
        })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      created?.remove()
      map.current = null
    }
  }, [])

  // marcadores + enquadramento a cada mudança de nível
  useEffect(() => {
    const m = map.current
    const lib = ml.current
    if (!m || !lib || !ready) return
    markers.current.forEach((mk) => mk.remove())
    markers.current = []
    spotClicks.current.clear()
    const spotFeatures = []
    for (const it of items) {
      if (it.type === 'spot') {
        spotClicks.current.set(it.spot.id, it.onClick)
        spotFeatures.push({
          type: 'Feature' as const,
          properties: { id: it.spot.id, name: it.spot.name, active: !!it.active },
          geometry: { type: 'Point' as const, coordinates: [it.spot.lon, it.spot.lat] },
        })
        continue
      }
      // cidades e estados: marcadores em forma de etiqueta com a contagem de picos
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'oo-place'
      el.innerHTML = `<span class="oo-place-name"></span><span class="oo-place-count"></span>`
      el.querySelector('.oo-place-name')!.textContent = it.place.name
      el.querySelector('.oo-place-count')!.textContent = String(it.place.count)
      el.setAttribute('aria-label', `${it.place.name}, ${it.place.count} picos`)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        it.onClick()
      })
      markers.current.push(new lib.Marker({ element: el, anchor: 'center' }).setLngLat([it.place.lon, it.place.lat]).addTo(m))
    }
    ;(m.getSource('spots') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: spotFeatures })

    // etiquetas de cidades vizinhas (ex.: Santos e São Vicente) não podem se sobrepor:
    // depois de cada movimento, empurra para baixo as que encostariam numa já posicionada
    const declutter = () => {
      const placed: DOMRect[] = []
      const list = markers.current.map((mk) => ({ mk, el: mk.getElement() }))
      list.forEach(({ mk }) => mk.setOffset([0, 0]))
      list
        .map((x) => ({ ...x, r: x.el.getBoundingClientRect() }))
        .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left)
        .forEach(({ mk, r }) => {
          let dy = 0
          for (let guard = 0; guard < 8; guard++) {
            const moved = new DOMRect(r.left, r.top + dy, r.width, r.height)
            const hit = placed.find((p) => moved.left < p.right + 4 && moved.right > p.left - 4 && moved.top < p.bottom + 4 && moved.bottom > p.top - 4)
            if (!hit) break
            dy = hit.bottom + 4 - r.top
          }
          if (dy) mk.setOffset([0, dy])
          placed.push(new DOMRect(r.left, r.top + dy, r.width, r.height))
        })
    }
    m.off('moveend', declutterRef.current)
    declutterRef.current = declutter
    m.on('moveend', declutter)
    const pts = items.map((it) => (it.type === 'place' ? it.place : it.spot))
    if (pts.length) {
      const b = bounds(pts)
      const single = pts.length === 1
      m.fitBounds(b, {
        padding: { top: 70, bottom: 50, left: 60, right: items[0]?.type === 'spot' ? 170 : 110 },
        maxZoom: single ? 13 : items[0]?.type === 'spot' ? 14.5 : 11,
        duration: 900,
      })
    }
  }, [items, ready])

  if (failed) return null

  return (
    <Box sx={{ position: 'relative', height, borderRadius: '18px', overflow: 'hidden', bgcolor: '#CFE6DC' }}>
      <Box
        ref={ref}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          '& .oo-place': {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 0,
            cursor: 'pointer',
            font: 'inherit',
            fontWeight: 800,
            fontSize: 13,
            px: '12px',
            py: '6px',
            borderRadius: '99px',
            bgcolor: brand.purple,
            color: brand.sand,
            boxShadow: '0 4px 14px rgba(75,29,90,.3)',
            whiteSpace: 'nowrap',
            transition: 'transform .15s',
            '&:hover': { transform: 'scale(1.06)', bgcolor: brand.plum },
          },
          '& .oo-place-count': {
            minWidth: 20,
            height: 20,
            borderRadius: '10px',
            bgcolor: brand.green,
            color: '#fff',
            fontSize: 11,
            display: 'inline-grid',
            placeItems: 'center',
            px: '5px',
          },
          '& .maplibregl-ctrl-group': { borderRadius: '10px', boxShadow: 'none', border: '1px solid rgba(75,29,90,.15)' },
        }}
      />
      {!ready && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <CircularProgress size={28} sx={{ color: brand.deepGreen }} />
        </Box>
      )}
      <Box
        component="a"
        href="https://openfreemap.org"
        target="_blank"
        rel="noopener"
        sx={{ position: 'absolute', right: 8, bottom: 4, fontSize: 10, color: brand.purple, opacity: 0.6, textDecoration: 'none', bgcolor: 'rgba(251,244,236,.8)', px: 0.75, borderRadius: 1 }}
      >
        {OFM_ATTRIBUTION}
      </Box>
    </Box>
  )
}
