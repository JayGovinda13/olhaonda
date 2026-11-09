import { Cloud, CloudSunny, Fog, HalfMoon, HeavyRain, Rain, Snow, SunLight, Thunderstorm } from 'iconoir-react'

type Props = { code: number | null | undefined; size?: number; color?: string; night?: boolean }

/** Ícone Iconoir para um código de tempo WMO. */
export function WeatherIcon({ code, size = 22, color = 'currentColor', night = false }: Props) {
  const p = { width: size, height: size, color, strokeWidth: 1.8 }
  if (code == null) return <Cloud {...p} />
  if (code === 0) return night ? <HalfMoon {...p} /> : <SunLight {...p} />
  if (code <= 2) return <CloudSunny {...p} />
  if (code === 3) return <Cloud {...p} />
  if (code <= 48) return <Fog {...p} />
  if (code <= 61) return <Rain {...p} />
  if (code <= 67) return <HeavyRain {...p} />
  if (code <= 77) return <Snow {...p} />
  if (code <= 82) return <HeavyRain {...p} />
  if (code <= 86) return <Snow {...p} />
  return <Thunderstorm {...p} />
}
