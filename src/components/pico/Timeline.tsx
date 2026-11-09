import { Box, IconButton, Slider, Typography } from '@mui/material'
import { Pause, Play } from 'iconoir-react'
import { useEffect, useRef, useState } from 'react'
import { dayLabel } from '../../lib/surf'
import { brand } from '../../theme'

/**
 * Linha do tempo dos mapas: arrastar escolhe a hora; o play avança de 3 em 3 horas.
 * A hora escolhida é a mesma do resto da página (card principal, hora a hora, maré).
 */
export function Timeline({ times, index, onChange }: { times: string[]; index: number; onChange: (i: number) => void }) {
  const [playing, setPlaying] = useState(false)
  const idx = useRef(index)
  useEffect(() => {
    idx.current = index
  }, [index])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const next = idx.current + 3 >= times.length ? 0 : idx.current + 3
      onChange(next)
    }, 700)
    return () => clearInterval(id)
  }, [playing, times.length, onChange])

  // marca no início de cada dia
  const marks = times.flatMap((t, i) => {
    if (!t.endsWith('T00:00') && i !== 0) return []
    const { wd, dm } = dayLabel(t.slice(0, 10))
    return [{ value: i, label: (<><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{wd} </Box>{dm.slice(0, 2)}</>) }]
  })
  const cur = times[index]

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, pt: 1 }}>
      <IconButton
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? 'Pausar animação' : 'Animar previsão'}
        sx={{ bgcolor: brand.purple, color: brand.sand, '&:hover': { bgcolor: brand.plum }, flexShrink: 0 }}
      >
        {playing ? <Pause width={20} height={20} /> : <Play width={20} height={20} />}
      </IconButton>
      <Box sx={{ flex: 1, px: 1, minWidth: 0 }}>
        <Slider
          value={index}
          min={0}
          max={Math.max(0, times.length - 1)}
          step={1}
          marks={marks}
          onChange={(_, v) => {
            setPlaying(false)
            onChange(v as number)
          }}
          valueLabelDisplay="auto"
          valueLabelFormat={(i) => {
            const t = times[i]
            if (!t) return ''
            const { wd, dm } = dayLabel(t.slice(0, 10))
            return `${wd} ${dm} · ${t.slice(11, 16)}`
          }}
          aria-label="Hora da previsão no mapa"
          sx={{
            color: brand.purple,
            '& .MuiSlider-markLabel': { fontSize: { xs: 9, sm: 11 }, fontWeight: 700, textTransform: 'capitalize', color: brand.purple, opacity: 0.7 },
            '& .MuiSlider-mark': { height: 10, width: 2, bgcolor: brand.purple, opacity: 0.35 },
            '& .MuiSlider-thumb': { width: 18, height: 18, border: `3px solid ${brand.sand}` },
          }}
        />
      </Box>
      {cur && (
        <Box sx={{ flexShrink: 0, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>
            {dayLabel(cur.slice(0, 10)).wd} {dayLabel(cur.slice(0, 10)).dm}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 800, bgcolor: brand.purple, color: brand.sand, px: 1, borderRadius: '6px' }}>
            {cur.slice(11, 16)}h
          </Typography>
        </Box>
      )}
    </Box>
  )
}
