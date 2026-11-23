import { Avatar, Box, Button, Container, Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material'
import { Camera, ChatLines, Instagram, LogIn, Lock, LogOut, SeaWaves, ShareIos, ShoppingBag, Star, Upload, User } from 'iconoir-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { backend } from '../backend'
import { FEATURES, HAS_COMMUNITY } from '../config/env'
import { useAuth } from '../auth/context'
import { alpha, brand } from '../theme'
import { LogoMark, Wordmark } from './Logo'
import { NotificationsBell } from './community/NotificationsBell'
import { ColorModeToggle } from './ColorModeToggle'

/** `login`: só aparece para quem está logado e com acesso liberado */
const NAV: { to: string; label: string; icon: ReactNode; end?: boolean; on: boolean; login?: boolean }[] = [
  { to: '/', label: 'Previsão', icon: <SeaWaves width={18} height={18} />, end: true, on: true },
  { to: '/forum', label: 'Fórum', icon: <ChatLines width={18} height={18} />, on: FEATURES.forum, login: true },
  { to: '/fotos', label: 'Fotos', icon: <Camera width={18} height={18} />, on: FEATURES.photos },
].filter((n) => n.on)

export function Header() {
  const { user, requireLogin } = useAuth()
  const member = Boolean(user?.approved) // acesso liberado (teste fechado)
  const nav = NAV.filter((n) => !n.login || member)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const navigate = useNavigate()
  const go = (to: string) => {
    setAnchor(null)
    navigate(to)
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
      <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, py: 1, px: { xs: 1.5, sm: 3 } }}>
        <Box component={NavLink} to="/" aria-label="OlhaOnda, início" sx={{ display: 'flex', alignItems: 'center', minHeight: 44, px: { xs: 0.5, md: 0 }, mr: { md: 2 } }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <LogoMark size={28} />
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Wordmark height={28} />
          </Box>
        </Box>

        <Stack component="nav" direction="row" spacing={0.25} sx={{ flex: 1, minWidth: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
          {nav.length > 1 && nav.map((n) => (
            <Button
              key={n.to}
              component={NavLink}
              to={n.to}
              end={n.end}
              startIcon={n.icon}
              color="primary"
              aria-label={n.label}
              sx={{
                borderRadius: 99,
                px: { xs: 1.25, sm: 2 },
                minWidth: 0,
                minHeight: 40,
                '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
                '&.active': { bgcolor: brand.purple, color: brand.sand },
                fontSize: { xs: 13, sm: 14 },
                // telas bem estreitas: só a página aberta mostra o nome, as outras viram só o ícone (assim o cabeçalho cabe)
                '@media (max-width: 419.95px)': { '&:not(.active)': { px: 1.25, '& .MuiButton-startIcon': { m: 0 }, '& .nav-label': { display: 'none' } } },
              }}
            >
              <span className="nav-label">{n.label}</span>
            </Button>
          ))}
        </Stack>

        <Tooltip title="Siga @olhaonda_ no Instagram">
          <IconButton
            component="a"
            href="https://www.instagram.com/olhaonda_/"
            target="_blank"
            rel="noopener"
            aria-label="Instagram do OlhaOnda (@olhaonda_)"
            sx={{ color: 'text.primary', display: { xs: 'none', sm: 'inline-flex' } }} // no celular o Instagram fica no rodapé
          >
            <Instagram width={20} height={20} />
          </IconButton>
        </Tooltip>
        <ColorModeToggle />
        {!HAS_COMMUNITY ? null : user ? (
          <>
            {member && <NotificationsBell />}
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Minha conta" sx={{ p: 0.25 }}>
              <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: brand.plum, color: brand.sand, fontWeight: 800 }}>
                {user.name.slice(0, 1).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 220 } } }}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>{user.name}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  {user.username ? `@${user.username} · ` : ''}
                  {user.isPhotographer ? 'Fotógrafo' : 'Surfista'}
                </Typography>
              </Box>
              <Divider />
              {member && (
                <MenuItem onClick={() => go('/meus-picos')}>
                  <ListItemIcon>
                    <Star width={18} height={18} />
                  </ListItemIcon>
                  Meus picos e alertas
                </MenuItem>
              )}
              <MenuItem onClick={() => go('/perfil')}>
                <ListItemIcon>
                  <User width={18} height={18} />
                </ListItemIcon>
                Meu perfil
              </MenuItem>
              {member && (
                <MenuItem onClick={() => go('/perfil#convite')}>
                  <ListItemIcon>
                    <ShareIos width={18} height={18} />
                  </ListItemIcon>
                  Convidar amigos
                </MenuItem>
              )}
              {user.isAdmin && (
                <MenuItem onClick={() => go('/admin')}>
                  <ListItemIcon>
                    <Lock width={18} height={18} />
                  </ListItemIcon>
                  Administração
                </MenuItem>
              )}
              <Divider />
              {/* MUI Menu não aceita Fragment como filho: itens condicionais em array */}
              {FEATURES.photos && [
                <MenuItem key="compras" onClick={() => go('/fotos/compras')}>
                  <ListItemIcon>
                    <ShoppingBag width={18} height={18} />
                  </ListItemIcon>
                  Minhas fotos
                </MenuItem>,
                <MenuItem key="vender" onClick={() => go('/fotos/vender')}>
                  <ListItemIcon>
                    <Upload width={18} height={18} />
                  </ListItemIcon>
                  {user.isPhotographer ? 'Painel do fotógrafo' : 'Vender fotos'}
                </MenuItem>,
                <Divider key="div" />,
              ]}
              <MenuItem
                onClick={() => {
                  setAnchor(null)
                  void backend.auth.signOut()
                }}
              >
                <ListItemIcon>
                  <LogOut width={18} height={18} />
                </ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => void requireLogin()}
              startIcon={<LogIn width={18} height={18} />}
              sx={{ borderRadius: 99, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Entrar
            </Button>
            <IconButton onClick={() => void requireLogin()} aria-label="Entrar" sx={{ display: { sm: 'none' } }}>
              <LogIn width={20} height={20} />
            </IconButton>
          </>
        )}
      </Container>
    </Box>
  )
}
