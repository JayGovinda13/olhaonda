import type { HourPoint } from '../api/openMeteo'

/** os dois swells da hora (direção de onde vêm, altura em mar aberto, período) */
export function hourSwells(hour: HourPoint) {
  const list = [
    { id: '1' as const, label: 'Swell 1', dir: hour.swellDirection ?? hour.waveDirection, h: hour.swellHeight ?? hour.waveHeight ?? 0, t: hour.swellPeakPeriod ?? hour.swellPeriod ?? hour.wavePeriod ?? 10 },
    { id: '2' as const, label: 'Swell 2', dir: hour.swell2Direction, h: hour.swell2Height ?? 0, t: hour.swell2Period ?? 10 },
  ]
  return list.filter((s) => s.dir != null && s.h >= 0.05) as { id: '1' | '2'; label: string; dir: number; h: number; t: number }[]
}
