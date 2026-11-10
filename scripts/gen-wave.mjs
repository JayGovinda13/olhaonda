// Gera public/bg-wave.svg: onda tubular minimalista, de inspiração oriental. Rode: node scripts/gen-wave.mjs
const C = { purple: '#4B1D5A', plum: '#7A2E6E', deep: '#0F4C3A', green: '#2FAE7B', sand: '#F5E6D3' }
const W = 800, H = 520
const cx = 330, cy = 250

function wave(k) {
  // k = 0 linha externa ... n linhas internas
  const off = k * 16
  const r1 = 150 - off
  const pts = []
  // costas da onda: do horizonte à direita subindo até a crista
  const crestX = cx, crestY = cy - r1
  const horizonY = 430 + k * 12
  const startX = W + 20
  const N = 60
  for (let i = 0; i <= N; i++) {
    const t = i / N
    // curva suave (ease) do horizonte até a crista
    const e = t * t * (3 - 2 * t)
    const x = startX + (crestX - startX) * t
    const y = horizonY + (crestY - horizonY) * Math.pow(e, 0.9)
    pts.push([x, y])
  }
  // lábio: espiral anti-horária a partir do topo, encolhendo
  const turns = 1.15 - k * 0.12
  const M = 140
  for (let i = 1; i <= M; i++) {
    const t = i / M
    const ang = -Math.PI / 2 - t * turns * 2 * Math.PI
    const r = r1 * Math.pow(1 - t * 0.82, 1.1)
    pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)])
  }
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')
}

const lines = [0, 1, 2, 3, 4]
  .map((k) => `<path d="${wave(k)}" fill="none" stroke="${k % 2 ? C.plum : C.deep}" stroke-width="${k === 0 ? 4 : 2.5}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${k === 0 ? 0.22 : 0.14}"/>`)
  .join('')

// corpo da onda: segue o traço externo (costas + primeira meia volta do tubo) e desce até o mar
function body() {
  const r1 = 150, turns = 1.15
  const pts = []
  const startX = W + 20, horizonY = 430, N = 60
  for (let i = 0; i <= N; i++) {
    const t = i / N, e = t * t * (3 - 2 * t)
    pts.push([startX + (cx - startX) * t, horizonY + (cy - r1 - horizonY) * Math.pow(e, 0.9)])
  }
  const M = 140, stop = Math.round(M * (0.5 / turns)) // meia volta: topo -> esquerda -> base
  for (let i = 1; i <= stop; i++) {
    const t = i / M
    const ang = -Math.PI / 2 - t * turns * 2 * Math.PI
    const r = r1 * Math.pow(1 - t * 0.82, 1.1)
    pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)])
  }
  const [bx, by] = pts[pts.length - 1]
  const d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')
  // da base do tubo, a face côncava desce suavemente até o mar
  return `${d} C ${bx + 70} ${by + 10}, ${bx + 40} ${by + 90}, ${bx - 40} ${H} L ${W + 20} ${H} Z`
}
const face = `<path d="${body()}" fill="${C.green}" fill-opacity="0.07"/>`
// sol (hinomaru) atrás, à direita da crista
const sun = `<circle cx="590" cy="150" r="64" fill="${C.plum}" fill-opacity="0.10"/>`
// gotas de espuma saindo do lábio
const foam = [[200,150,5],[176,176,4],[214,124,3.5],[160,206,3]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.deep}" fill-opacity="0.16"/>`).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${sun}${face}${lines}${foam}</svg>`
import { writeFileSync } from 'node:fs'
writeFileSync(new URL('../public/bg-wave.svg', import.meta.url), svg)
console.log('public/bg-wave.svg', svg.length, 'bytes')

// ---------------------------------------------------------------------------
// Fundo do site: ladrilho com ondas pequenas repetidas em diagonal + sol no canto.
// Gera public/bg-waves-tile.svg e public/bg-sun.svg
// ---------------------------------------------------------------------------
const TILE = 300
// só os traços (sem o preenchimento da face, que passaria da borda do ladrilho)
const mini = (x, y, s, op) =>
  `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}">${lines}${foam}</g>`
// duas ondas por ladrilho, deslocadas meio ladrilho na diagonal -> fileiras diagonais ao repetir
const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">
${mini(-6, 14, 0.18, 0.75)}
${mini(TILE / 2 - 6, TILE / 2 + 14, 0.18, 0.75)}
</svg>`
writeFileSync(new URL('../public/bg-waves-tile.svg', import.meta.url), tile)
const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="${C.plum}" fill-opacity="0.12"/></svg>`
writeFileSync(new URL('../public/bg-sun.svg', import.meta.url), sunSvg)
console.log('public/bg-waves-tile.svg e public/bg-sun.svg')

// Modo noturno: mesmas formas com cores claras e opacidade menor
const night = (s) =>
  s
    .replaceAll('#0F4C3A', '#7BD9AE')
    .replaceAll('#7A2E6E', '#D9A2D3')
    .replaceAll('stroke-opacity="0.14"', 'stroke-opacity="0.08"')
    .replaceAll('stroke-opacity="0.22"', 'stroke-opacity="0.13"')
    .replaceAll('fill-opacity="0.16"', 'fill-opacity="0.08"')
    .replace('fill="#D9A2D3" fill-opacity="0.12"', 'fill="#D9A2D3" fill-opacity="0.07"')
writeFileSync(new URL('../public/bg-waves-tile-dark.svg', import.meta.url), night(tile))
writeFileSync(new URL('../public/bg-sun-dark.svg', import.meta.url), night(sunSvg))
console.log('public/bg-waves-tile-dark.svg e public/bg-sun-dark.svg')
