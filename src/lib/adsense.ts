import { ADSENSE_CLIENT } from '../config/ads'
import type { Consent } from './consent'

type AdsQueue = unknown[] & { requestNonPersonalizedAds?: number }

let adsenseLoaded = false
/** Carrega o AdSense só depois da escolha de cookies; "recusar" pede anúncios não personalizados. */
export function loadAdsense(consent: Exclude<Consent, null>) {
  if (adsenseLoaded || !ADSENSE_CLIENT) return
  adsenseLoaded = true
  const w = window as unknown as { adsbygoogle?: AdsQueue }
  w.adsbygoogle = w.adsbygoogle || ([] as AdsQueue)
  if (consent === 'denied') w.adsbygoogle.requestNonPersonalizedAds = 1
  const s = document.createElement('script')
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  document.head.appendChild(s)
}
