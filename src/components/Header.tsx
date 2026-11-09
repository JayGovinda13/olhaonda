import { Autocomplete, Box, Container, IconButton, TextField, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Position, Search } from 'iconoir-react'
import { useState } from 'react'
import { nearestSpot, SPOTS, type Spot } from '../data/spots'
import { brand } from '../theme'
import { LogoMark, Wordmark } from './Logo'

export function Header({ spot, onChange }: { spot: Spot; onChange: (s: Spot) => void }) {
  const [locating, setLocating] = useState(false)

  const locate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onChange(nearestSpot(pos.coords.latitude, pos.coords.longitude))
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
        bgcolor: alpha(brand.sand, 0.86),
        borderBottom: `1px solid ${alpha(brand.purple, 0.08)}`,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: { xs: 2, sm: 3 } }}
      >
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <LogoMark size={30} />
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Wordmark height={30} />
        </Box>
        <Box sx={{ flex: 1 }} />
        <Autocomplete
          size="small"
          options={SPOTS}
          value={spot}
          disableClearable
          groupBy={(s) => s.state}
          getOptionLabel={(s) => `${s.name} · ${s.city}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_, s) => s && onChange(s)}
          sx={{ width: { xs: '100%', sm: 320 }, maxWidth: 360 }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Buscar pico"
              aria-label="Buscar pico"
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  startAdornment: (
                    <Box sx={{ display: 'flex', pl: 0.5, color: 'text.secondary' }}>
                      <Search width={18} height={18} />
                    </Box>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 99, bgcolor: 'background.paper' },
                '& fieldset': { borderColor: alpha(brand.purple, 0.14) },
              }}
            />
          )}
        />
        <Tooltip title="Pico mais perto de mim">
          <IconButton
            onClick={locate}
            disabled={locating}
            aria-label="Usar minha localização"
            sx={{ bgcolor: 'background.paper', border: `1px solid ${alpha(brand.purple, 0.14)}` }}
          >
            <Position width={20} height={20} />
          </IconButton>
        </Tooltip>
      </Container>
    </Box>
  )
}
