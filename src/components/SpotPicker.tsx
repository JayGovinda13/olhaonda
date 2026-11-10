import { Autocomplete, Box, IconButton, Stack, TextField, Tooltip } from '@mui/material'
import { Position, Search } from 'iconoir-react'
import { useState } from 'react'
import { nearestSpot, SPOTS, type Spot } from '../data/spots'
import { alpha, brand } from '../theme'

/** Busca de picos agrupada por região, com botão "mais perto de mim". */
export function SpotPicker({
  value,
  onChange,
  allowEmpty = false,
  placeholder = 'Buscar pico',
  locate = true,
  width = 360,
}: {
  value: Spot | null
  onChange: (s: Spot | null) => void
  allowEmpty?: boolean
  placeholder?: string
  locate?: boolean
  width?: number | string
}) {
  const [locating, setLocating] = useState(false)

  const findMe = () => {
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
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%', maxWidth: width }}>
      <Autocomplete
        size="small"
        options={SPOTS}
        value={value}
        disableClearable={!allowEmpty}
        groupBy={(s) => s.region ?? s.state}
        getOptionLabel={(s) => `${s.name} · ${s.city}`}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, s) => onChange(s ?? null)}
        sx={{ flex: 1 }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            slotProps={{
              ...params.slotProps,
              htmlInput: { ...params.slotProps.htmlInput, 'aria-label': placeholder },
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
      {locate && (
        <Tooltip title="Pico mais perto de mim">
          <span>
            <IconButton
              onClick={findMe}
              disabled={locating}
              aria-label="Usar minha localização"
              sx={{ bgcolor: 'background.paper', border: `1px solid ${alpha(brand.purple, 0.14)}` }}
            >
              <Position width={20} height={20} />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  )
}
