import { Badge, Box, Button, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Bell } from 'iconoir-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useNotifications } from '../../hooks/useNotifications'
import { timeAgo } from '../../lib/time'
import { brand } from '../../theme'

/** Sino do cabeçalho: avisos de previsão que bate com o gosto do usuário. */
export function NotificationsBell() {
  const { list, unread, markRead } = useNotifications()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const navigate = useNavigate()

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Notificações${unread ? `, ${unread} novas` : ''}`}>
        <Badge badgeContent={unread} color="success" max={9}>
          <Bell width={22} height={22} />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 360, maxWidth: 'calc(100vw - 24px)', maxHeight: 460 } } }}
      >
        <Stack direction="row" sx={{ px: 2, py: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 800 }}>Avisos</Typography>
          {unread > 0 && (
            <Button size="small" onClick={() => void markRead('all')}>
              Marcar como lidos
            </Button>
          )}
        </Stack>
        <Divider />
        {list.length === 0 && (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Nenhum aviso ainda. Favorite um pico e conte as condições que você gosta: avisamos quando a previsão bater.
            </Typography>
          </Box>
        )}
        {list.slice(0, 20).map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => {
              setAnchor(null)
              if (!n.readAt) void markRead([n.id])
              navigate(n.url)
            }}
            sx={{ whiteSpace: 'normal', alignItems: 'flex-start', gap: 1.25, py: 1.25, bgcolor: n.readAt ? 'transparent' : alpha(brand.green, 0.08) }}
          >
            <Box sx={{ width: 8, height: 8, mt: 0.9, borderRadius: '50%', flexShrink: 0, bgcolor: n.readAt ? 'transparent' : brand.green }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{n.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {n.body}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.55 }}>
                {timeAgo(n.createdAt)}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null)
            navigate('/meus-picos')
          }}
          sx={{ justifyContent: 'center', fontWeight: 700, color: brand.plum }}
        >
          Meus picos e alertas
        </MenuItem>
      </Menu>
    </>
  )
}
