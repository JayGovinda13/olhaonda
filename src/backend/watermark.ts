/**
 * Gera no navegador a prévia pública de uma foto: reduzida (máx. 1600 px) e com
 * marca d'água repetida na diagonal. O original nunca fica público.
 */
export async function makePreview(file: File, credit: string) {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, 1600 / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const text = `OlhaOnda · ${credit}`
  const fontSize = Math.max(18, Math.round(w / 22))
  ctx.font = `800 ${fontSize}px "Manrope Variable", system-ui, sans-serif`
  ctx.fillStyle = 'rgba(245, 230, 211, 0.35)'
  ctx.strokeStyle = 'rgba(75, 29, 90, 0.25)'
  ctx.lineWidth = Math.max(1, fontSize / 18)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-Math.PI / 7)
  const stepX = ctx.measureText(text).width + fontSize * 2
  const stepY = fontSize * 3.2
  const span = Math.hypot(w, h)
  for (let y = -span; y < span; y += stepY) {
    const offset = (Math.round(y / stepY) % 2) * (stepX / 2)
    for (let x = -span; x < span; x += stepX) {
      ctx.strokeText(text, x + offset, y)
      ctx.fillText(text, x + offset, y)
    }
  }
  ctx.restore()

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar prévia'))), 'image/jpeg', 0.78),
  )
  return { blob, width, height }
}
