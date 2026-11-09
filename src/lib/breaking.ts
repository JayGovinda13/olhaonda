import type { HourPoint } from '../api/openMeteo'
import type { Spot } from '../data/spots'

/**
 * Altura da onda na arrebentação, estimada por física a partir do mar aberto.
 *
 * Os modelos (ECMWF WAM, MFWAM, GFS-Wave) dão a altura significativa Hs no ponto de mar mais próximo,
 * a alguns km da praia. Para saber o tamanho que a onda QUEBRA no pico, cada trem de ondas
 * (swell 1, swell 2 e mar de vento) é levado até a praia separadamente:
 *
 * 1. Exposição + refração (lei de Snell e conservação do fluxo de energia):
 *    a onda que chega com ângulo θ em relação à direção para onde a praia está virada
 *    espalha a energia num trecho de costa maior; o fluxo que chega por metro de praia
 *    cai com cos θ. Acima de 90° (vindo "de trás" da praia) não chega nada.
 *    O swell não vem de uma direção só: espalhamos a direção (mais estreito em período longo,
 *    mais largo no mar de vento) e tiramos a média de cos θ. Isso suaviza a borda dos 90°.
 *
 * 2. Empinamento até a quebra (Komar & Gaughan, 1972), também por fluxo de energia:
 *    Hb = 0,39 · g^(1/5) · (T · H0² · cos θ)^(2/5)
 *    Período maior = onda cresce mais ao chegar no raso. Ex.: 1 m com 14 s quebra ~1,8 m;
 *    1 m com 7 s quebra ~1,3 m.
 *
 * 3. Os trens se somam pela energia: Hb = √(Hb1² + Hb2² + Hb3²).
 *
 * 4. Ajuste por pico (`surfFactor`, padrão 1): bancadas de areia, lajes e fundo que concentram
 *    ou espalham a onda. Calibrado comparando com o mar real.
 *
 * Hb é a altura significativa na quebra (média do terço maior, da cava à crista ≈ altura da face).
 * A faixa exibida vai de 70% (onda comum) a 100% (séries).
 */

const G = 9.81
const KG = 0.39 * Math.pow(G, 0.2)

/** fração do fluxo de energia que chega à praia, com espalhamento direcional gaussiano */
export function exposure(fromDeg: number, facing: number, spreadDeg: number) {
  const N = 13
  let sum = 0
  let wsum = 0
  for (let i = 0; i < N; i++) {
    const off = ((i / (N - 1)) * 2 - 1) * 2 * spreadDeg // ±2σ
    const w = Math.exp(-0.5 * (off / spreadDeg) ** 2)
    const d = Math.abs(((((fromDeg + off - facing) % 360) + 540) % 360) - 180)
    sum += w * Math.max(0, Math.cos((d * Math.PI) / 180))
    wsum += w
  }
  return sum / wsum
}

/** largura do espalhamento direcional (σ, graus) pelo período */
function spreadFor(period: number, windSea: boolean) {
  if (windSea) return 35
  return Math.min(30, Math.max(12, 42 - 2 * period))
}

export function breakerHeight(h0: number, period: number, cosTheta: number) {
  if (h0 <= 0 || period <= 0 || cosTheta <= 0) return 0
  return KG * Math.pow(period * h0 * h0 * cosTheta, 0.4)
}

export type SurfTrain = { label: string; h0: number; period: number; dir: number; exposure: number; hb: number }
export type SurfEstimate = { hb: number; lo: number; hi: number; trains: SurfTrain[] }

export function surfEstimate(spot: Spot, h: HourPoint): SurfEstimate | null {
  const raw: { label: string; h: number | null; t: number | null; d: number | null; windSea?: boolean }[] = [
    { label: 'Swell 1', h: h.swellHeight, t: h.swellPeakPeriod ?? h.swellPeriod, d: h.swellDirection },
    { label: 'Swell 2', h: h.swell2Height, t: h.swell2Period, d: h.swell2Direction },
    { label: 'Mar de vento', h: h.windWaveHeight, t: h.windWavePeriod, d: h.windWaveDirection, windSea: true },
  ]
  let comps = raw.filter((c) => c.h != null && c.h > 0.02 && c.t != null && c.d != null)
  // sem os componentes: usa o mar total
  if (!comps.length) {
    if (h.waveHeight == null || h.wavePeriod == null || h.waveDirection == null) return null
    comps = [{ label: 'Mar total', h: h.waveHeight, t: h.wavePeriod, d: h.waveDirection }]
  }
  const factor = (spot.surfFactor ?? 1) * (spot.sheltered ? 0.5 : 1)
  const trains = comps.map((c) => {
    const ex = exposure(c.d!, spot.facing, spreadFor(c.t!, !!c.windSea))
    return { label: c.label, h0: c.h!, period: c.t!, dir: c.d!, exposure: ex, hb: breakerHeight(c.h!, c.t!, ex) * factor }
  })
  const hb = Math.sqrt(trains.reduce((s, t) => s + t.hb * t.hb, 0))
  return { hb, lo: hb * 0.7, hi: hb, trains }
}

/** "1,2–1,7 m" na arrebentação */
export function surfRange(e: SurfEstimate | null) {
  if (!e) return '—'
  if (e.hi < 0.15) return 'Flat'
  const f = (v: number) => v.toFixed(1).replace('.', ',')
  return `${f(e.lo)}–${f(e.hi)} m`
}
