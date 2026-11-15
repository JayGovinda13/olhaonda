import { Badge, Box, Button, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { Bell } from 'iconoir-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { NotificationBody } from './NotificationBody'
import { useNotifications } from '../../hooks/useNotifications'
import { groupNotifications } from '../../lib/alertGroups'
import { ALERT_KIND } from '../../lib/alertKinds'
import { timeAgo } from '../../lib/time'
import { alpha, brand } from '../../theme'

/** Sino do cabeçalho: avisos de previsão que bate com o gosto do usuário. */
export function NotificationsBell() {
  const { list, unread, markRead } = useNotifications()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set()) // picos com os avisos anteriores abertos
  const toggle = (key: string) =>
    setExpanded((cur) => {
      const next = new Set(cur)
      if (!next.delete(key)) next.add(key)
      return next
    })
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
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 400, maxWidth: 'calc(100vw - 24px)', maxHeight: 560 } } }}
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
        {groupNotifications(list.slice(0, 40))
          .slice(0, 10)
          .flatMap((g) => {
            const n = g.latest
            const open = expanded.has(g.key)
            const rows = [
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
                  <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                    <span aria-hidden="true">{ALERT_KIND[n.kind].emoji} </span>
                    {n.title}
                  </Typography>
                  <NotificationBody
                    n={n}
                    onOpen={(to) => {
                      setAnchor(null)
                      if (!n.readAt) void markRead([n.id])
                      navigate(to)
                    }}
                  />
                  <Typography variant="caption" sx={{ opacity: 0.55 }}>
                    {timeAgo(n.createdAt)}
                  </Typography>
                </Box>
              </MenuItem>,
            ]
            if (g.older.length) {
              rows.push(
                <MenuItem
                  key={`${g.key}-mais`}
                  onClick={() => toggle(g.key)}
                  sx={{ justifyContent: 'center', py: 0.5, minHeight: 36, fontSize: 13, fontWeight: 700, color: brand.plum }}
                >
                  {open ? 'Ocultar anteriores' : `Ver ${g.older.length} ${g.older.length === 1 ? 'aviso anterior' : 'avisos anteriores'} deste pico`}
                </MenuItem>,
              )
              if (open)
                for (const o of g.older)
                  rows.push(
                    <MenuItem
                      key={o.id}
                      onClick={() => {
                        setAnchor(null)
                        if (!o.readAt) void markRead([o.id])
                        navigate(o.url)
                      }}
                      sx={{ whiteSpace: 'normal', gap: 1, py: 0.75, pl: 3, opacity: o.readAt ? 0.7 : 1 }}
                    >
                      <Typography variant="body2" sx={{ flex: 1, fontSize: 13 }}>
                        <span aria-hidden="true">{ALERT_KIND[o.kind].emoji} </span>
                        {ALERT_KIND[o.kind].label}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6, whiteSpace: 'nowrap' }}>
                        {timeAgo(o.createdAt)}
                      </Typography>
                    </MenuItem>,
                  )
            }
            return rows
          })}
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
