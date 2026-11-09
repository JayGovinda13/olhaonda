// Gera os arquivos do logo em brand/ (texto em curvas). Requer: npm i -D opentype.js @fontsource/manrope; rode: node scripts/gen-logo.cjs brand
const fs = require('fs'), opentype = require('opentype.js')
const font = opentype.parse(fs.readFileSync('node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff').buffer)
const C = { purple: '#4B1D5A', plum: '#7A2E6E', deep: '#0F4C3A', green: '#2FAE7B', sand: '#F5E6D3' }
let uid = 0

// "O" em forma de lente (viewBox 0 0 100 112), mesmo desenho do componente Lens do site
function lens(x, y, size, ring, eyepiece) {
  const s = size / 100, id = 'c' + uid++
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <defs><clipPath id="${id}"><circle cx="50" cy="62" r="32"/></clipPath></defs>
  <rect x="30" y="0" width="40" height="20" rx="6" fill="${eyepiece}"/>
  <g clip-path="url(#${id})">
    <path d="M10 72 C 24 60, 36 60, 50 70 S 76 82, 92 68 L 92 100 L 10 100 Z" fill="${C.green}"/>
    <path d="M10 84 C 26 76, 38 78, 52 84 S 78 92, 92 82 L 92 100 L 10 100 Z" fill="${C.deep}" opacity="0.55"/>
  </g>
  <circle cx="50" cy="62" r="38" fill="none" stroke="${ring}" stroke-width="13"/>
  <path d="M30 48 A 24 24 0 0 1 44 36" fill="none" stroke="${C.sand}" stroke-width="5" stroke-linecap="round"/>
</g>`
}

function text(str, x, baseline, size, fill) {
  let cx = x, d = ''
  for (const g of font.stringToGlyphs(str)) {
    d += g.getPath(cx, baseline, size).toPathData(2)
    cx += (g.advanceWidth / font.unitsPerEm) * size - 0.04 * size
  }
  return { svg: `<path d="${d}" fill="${fill}"/>`, end: cx + 0.04 * size }
}

// wordmark: lente + "lha" + lente + "nda"
function wordmark(ring, eyepiece, letters) {
  const H = 100, L = 82, B = 112 // altura da fonte, largura da lente, linha de base
  const lensY = B + 1 - 0.95 * L * 1.12 // anel da lente termina na linha de base
  let x = 6, parts = []
  parts.push(lens(x, lensY, L, ring, eyepiece)); x += L + 3
  let t = text('lha', x, B, H, letters); parts.push(t.svg); x = t.end + 12
  parts.push(lens(x, lensY, L, ring, eyepiece)); x += L + 3
  t = text('nda', x, B, H, letters); parts.push(t.svg); x = t.end + 6
  const w = Math.ceil(x), h = 140
  return { w, h, body: parts.join('\n') }
}

function mark(ring, eyepiece) {
  const lensAt = (cx) => { const id = 'm' + uid++; return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="72" r="31"/></clipPath></defs>
  <rect x="${cx - 20}" y="8" width="40" height="22" rx="7" fill="${eyepiece}"/>
  <g clip-path="url(#${id})"><path d="M${cx - 40} 82 C ${cx - 26} 70, ${cx - 14} 70, ${cx} 80 S ${cx + 26} 92, ${cx + 40} 78 L ${cx + 40} 110 L ${cx - 40} 110 Z" fill="${C.green}"/>
  <path d="M${cx - 40} 94 C ${cx - 24} 86, ${cx - 12} 88, ${cx + 2} 94 S ${cx + 28} 102, ${cx + 40} 92 L ${cx + 40} 110 L ${cx - 40} 110 Z" fill="${C.deep}" opacity="0.55"/></g>
  <circle cx="${cx}" cy="72" r="38" fill="none" stroke="${ring}" stroke-width="13"/>
  <path d="M${cx - 20} 58 A 24 24 0 0 1 ${cx - 6} 46" fill="none" stroke="${C.sand}" stroke-width="5" stroke-linecap="round"/>` }
  return `<rect x="92" y="44" width="36" height="20" rx="6" fill="${ring}"/><circle cx="110" cy="54" r="9" fill="${eyepiece}"/>${lensAt(56)}${lensAt(164)}`
}

const out = process.argv[2]
const svg = (w, h, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}\n${body}\n</svg>\n`
const wm = wordmark(C.purple, C.plum, C.purple)
fs.writeFileSync(`${out}/olhaonda-logo.svg`, svg(wm.w, wm.h, wm.body))
const wmLight = wordmark(C.sand, C.green, C.sand)
fs.writeFileSync(`${out}/olhaonda-logo-claro.svg`, svg(wmLight.w, wmLight.h, wmLight.body))
fs.writeFileSync(`${out}/olhaonda-simbolo.svg`, svg(220, 120, mark(C.purple, C.plum)))
fs.writeFileSync(`${out}/olhaonda-simbolo-claro.svg`, svg(220, 120, mark(C.sand, C.green)))
// ícone quadrado para redes sociais / perfil
fs.writeFileSync(`${out}/olhaonda-icone.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="960" height="960"><rect width="240" height="240" rx="52" fill="${C.sand}"/><g transform="translate(10 60)">${mark(C.purple, C.plum)}</g></svg>\n`)
console.log('wordmark', wm.w, 'x', wm.h)
