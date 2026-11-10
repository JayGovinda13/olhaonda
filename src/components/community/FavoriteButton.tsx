import { Button, IconButton, Tooltip } from '@mui/material'
import { Star, StarSolid } from 'iconoir-react'
import { useState } from 'react'
import { useAuth } from '../../auth/context'
import type { Spot } from '../../data/spots'
import { useFavorites } from '../../hooks/useFavorites'
import { resetDemoAlerts } from '../../hooks/useDemoAlerts'
import { brand } from '../../theme'
import { PrefsDialog } from './PrefsDialog'

/** Estrela de favorito do pico: abre as condições preferidas (e os alertas). */
export function FavoriteButton({ spot, compact = false }: { spot: Spot; compact?: boolean }) {
  const { user, requireLogin } = useAuth()
  const { get, save, remove } = useFavorites()
  const [open, setOpen] = useState(false)
  const fav = get(spot.id)

  const click = async () => {
    if (!user && !(await requireLogin('Entre para favoritar o pico e receber avisos quando a previsão bater com o seu gosto.'))) return
    setOpen(true)
  }

  const label = fav ? 'Favorito · editar condições' : 'Favoritar e receber avisos'
  const icon = fav ? <StarSolid width={18} height={18} color={brand.green} /> : <Star width={18} height={18} />

  return (
    <>
      {compact ? (
        <Tooltip title={label}>
          <IconButton onClick={() => void click()} aria-label={label} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
            {icon}
          </IconButton>
        </Tooltip>
      ) : (
        <Button variant="outlined" onClick={() => void click()} startIcon={icon} sx={{ borderRadius: 99, bgcolor: 'background.paper', whiteSpace: 'nowrap' }}>
          {fav ? 'Favorito' : 'Favoritar'}
        </Button>
      )}
      {open && (
        <PrefsDialog
          open
          spot={spot}
          initial={fav?.prefs ?? null}
          initialNotify={fav?.notify ?? true}
          isFavorite={!!fav}
          onClose={() => setOpen(false)}
          onSave={async (prefs, notify) => {
            await save(spot.id, prefs, notify)
            if (user) resetDemoAlerts(user.id)
          }}
          onRemove={() => remove(spot.id)}
        />
      )}
    </>
  )
}
