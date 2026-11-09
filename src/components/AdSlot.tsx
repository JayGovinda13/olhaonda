import { Box, Link, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Megaphone } from 'iconoir-react'
import { useEffect, useRef } from 'react'
import { IS_PRODUCTION } from '../config/env'
import { brand } from '../theme'

/**
 * Espaço publicitário.
 *
 * 1. Venda direta (recomendado para surf shops, escolas e pousadas locais):
 *    cadastre o anúncio em HOUSE_ADS — imagem + link, sem depender de terceiros.
 * 2. Google AdSense para preencher o inventário que sobrar:
 *    defina VITE_ADSENSE_CLIENT (ca-pub-…) e os IDs de bloco VITE_ADSENSE_SLOT_*.
 * Sem nada configurado, mostra um convite "Anuncie aqui".
 */

export type AdFormat = 'leaderboard' | 'rectangle' | 'inline'

type HouseAd = { image: string; href: string; alt: string }

/** Anúncios vendidos diretamente, por formato. Ex.: { leaderboard: [{ image: '/ads/loja.jpg', href: 'https://…', alt: 'Loja X' }] } */
const HOUSE_ADS: Partial<Record<AdFormat, HouseAd[]>> = {}

// AdSense só em produção: cliques de teste em staging podem suspender a conta
const ADSENSE_CLIENT = IS_PRODUCTION ? (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined) : undefined
const ADSENSE_SLOTS: Record<AdFormat, string | undefined> = {
  leaderboard: import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD,
  rectangle: import.meta.env.VITE_ADSENSE_SLOT_RECTANGLE,
  inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE,
}

const SIZE: Record<AdFormat, { minHeight: { xs: number; md: number }; label: string }> = {
  leaderboard: { minHeight: { xs: 100, md: 90 }, label: '728×90 · 320×100' },
  rectangle: { minHeight: { xs: 250, md: 250 }, label: '300×250' },
  inline: { minHeight: { xs: 100, md: 120 }, label: 'Nativo' },
}

const CONTACT = (import.meta.env.VITE_ADS_CONTACT as string | undefined) ?? 'mailto:anuncie@olhaonda.com.br'

let adsenseLoaded = false
function loadAdsense() {
  if (adsenseLoaded || !ADSENSE_CLIENT) return
  adsenseLoaded = true
  const s = document.createElement('script')
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  document.head.appendChild(s)
}

export function AdSlot({ format = 'leaderboard', seed = 0 }: { format?: AdFormat; seed?: number }) {
  const house = HOUSE_ADS[format]
  const slot = ADSENSE_SLOTS[format]
  const insRef = useRef<HTMLModElement>(null)
  const size = SIZE[format]

  useEffect(() => {
    if (house?.length || !ADSENSE_CLIENT || !slot || !insRef.current) return
    loadAdsense()
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      ;(w.adsbygoogle = w.adsbygoogle || []).push({})
    } catch {
      /* bloqueador de anúncios */
    }
  }, [house, slot])

  const frame = {
    position: 'relative',
    minHeight: size.minHeight,
    borderRadius: '18px',
    overflow: 'hidden',
  } as const

  const tag = (
    <Typography
      sx={{ position: 'absolute', top: 8, right: 12, fontSize: 10, fontWeight: 800, letterSpacing: '.08em', opacity: 0.5 }}
    >
      PUBLICIDADE
    </Typography>
  )

  if (house?.length) {
    const ad = house[seed % house.length]
    return (
      <Box component="aside" sx={frame}>
        <Link href={ad.href} target="_blank" rel="sponsored noopener">
          <Box component="img" src={ad.image} alt={ad.alt} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </Link>
        {tag}
      </Box>
    )
  }

  if (ADSENSE_CLIENT && slot) {
    return (
      <Box component="aside" sx={{ ...frame, textAlign: 'center' }}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </Box>
    )
  }

  return (
    <Box
      component="aside"
      sx={{
        ...frame,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 3,
        py: 2,
        border: `1.5px dashed ${alpha(brand.purple, 0.22)}`,
        bgcolor: alpha(brand.plum, 0.04),
        flexDirection: format === 'rectangle' ? 'column' : 'row',
        textAlign: format === 'rectangle' ? 'center' : 'left',
      }}
    >
      {tag}
      <Box sx={{ color: brand.plum, display: 'flex' }}>
        <Megaphone width={28} height={28} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800 }}>Sua marca aqui</Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Fale com quem olha o mar todo dia.{' '}
          <Link href={CONTACT} color="secondary" sx={{ fontWeight: 700 }}>
            Anuncie no OlhaOnda
          </Link>
        </Typography>
        <Typography sx={{ fontSize: 11, opacity: 0.45, mt: 0.5 }}>{size.label}</Typography>
      </Box>
    </Box>
  )
}
