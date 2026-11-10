import { brand } from '../theme'

/** Desenho da Lua com a parte iluminada correta (hemisfério sul: crescente iluminada à esquerda). */
export function MoonIcon({ phase, size = 40 }: { phase: number; size?: number }) {
  const r = 20
  const lit = brand.sand
  const dark = '#2B1233'
  // terminador: elipse com raio horizontal r·cos(2πφ)
  const k = Math.cos(2 * Math.PI * phase)
  const rx = Math.abs(k) * r
  const waxing = phase < 0.5
  // no hemisfério sul o lado iluminado da crescente é o esquerdo
  const litLeft = waxing
  // semicírculo iluminado (de cima para baixo pelo lado aceso) e volta pelo terminador:
  // no crescente fino (k > 0) o terminador curva para o lado aceso; no giboso, para o escuro
  const outer = litLeft ? 0 : 1
  const inner = (k > 0) === litLeft ? 1 : 0
  const d = `M 0 ${-r} A ${r} ${r} 0 0 ${outer} 0 ${r} A ${rx} ${r} 0 0 ${inner} 0 ${-r} Z`
  return (
    <svg width={size} height={size} viewBox="-22 -22 44 44" aria-hidden>
      <circle r={r} fill={dark} />
      <path d={d} fill={lit} />
      <circle r={r} fill="none" stroke={brand.purple} strokeOpacity={0.25} />
    </svg>
  )
}
