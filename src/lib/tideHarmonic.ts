/**
 * Maré além do horizonte do modelo, por análise harmônica.
 *
 * A maré é a soma de ondas com períodos astronômicos conhecidos (as "constituintes":
 * M2 lunar 12,42 h, S2 solar 12 h, N2, K1, O1, Q1 e as de águas rasas M4, MS4).
 * Ajustamos amplitude e fase de cada uma (mínimos quadrados) nos ~40 dias de nível do mar que
 * o modelo já entregou (30 passados + ~10 previstos) e prolongamos a curva para os dias seguintes.
 * K2 e P1 não se separam de S2 e K1 em 40 dias: entram pelas razões de equilíbrio (0,27 e 0,33).
 */

const DEG = Math.PI / 180
/** velocidades angulares (graus por hora) */
const C = {
  M2: 28.9841042,
  S2: 30.0,
  N2: 28.4397295,
  K2: 30.0821373,
  K1: 15.0410686,
  O1: 13.9430356,
  P1: 14.9589314,
  Q1: 13.3986609,
  M4: 57.9682084,
  MS4: 58.9841042,
}

/** cada termo do modelo: [velocidade, (velocidade e peso do "irmão" inferido)] */
const TERMS: [number, number?, number?][] = [
  [C.M2],
  [C.S2, C.K2, 0.27],
  [C.N2],
  [C.K1, C.P1, 0.33],
  [C.O1],
  [C.Q1],
  [C.M4],
  [C.MS4],
]

function basis(t: number): number[] {
  const row = [1]
  for (const [w, w2, k] of TERMS) {
    let c = Math.cos(w * t * DEG)
    let s = Math.sin(w * t * DEG)
    if (w2 && k) {
      c += k * Math.cos(w2 * t * DEG)
      s += k * Math.sin(w2 * t * DEG)
    }
    row.push(c, s)
  }
  return row
}

function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const M = A.map((r, i) => [...r, b[i]])
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r
    if (Math.abs(M[p][i]) < 1e-12) return null
    ;[M[i], M[p]] = [M[p], M[i]]
    for (let r = 0; r < n; r++) {
      if (r === i) continue
      const f = M[r][i] / M[i][i]
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]
    }
  }
  return M.map((r, i) => r[n] / r[i])
}

const hoursOf = (iso: string) => Date.parse(`${iso}:00Z`) / 3_600_000

/**
 * Preenche as horas sem nível do mar (depois do fim do modelo) com a previsão harmônica.
 * Devolve o nível e se ele veio do ajuste.
 */
export function extendTide(times: string[], levels: (number | null)[]): { level: number | null; modeled: boolean }[] {
  const pts = times.map((t, i) => ({ t: hoursOf(t), v: levels[i] })).filter((p): p is { t: number; v: number } => p.v != null)
  if (pts.length < 24 * 20) return levels.map((v) => ({ level: v, modeled: false }))
  const n = 1 + TERMS.length * 2
  const AtA = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  const Atb = new Array<number>(n).fill(0)
  for (const p of pts) {
    const r = basis(p.t)
    for (let i = 0; i < n; i++) {
      Atb[i] += r[i] * p.v
      for (let j = 0; j < n; j++) AtA[i][j] += r[i] * r[j]
    }
  }
  const x = solve(AtA, Atb)
  if (!x) return levels.map((v) => ({ level: v, modeled: false }))
  return times.map((t, i) => {
    if (levels[i] != null) return { level: levels[i], modeled: false }
    const r = basis(hoursOf(t))
    return { level: r.reduce((s, v, k) => s + v * x[k], 0), modeled: true }
  })
}
