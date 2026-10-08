export type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png'

export const FORMATS: ReadonlyArray<{ value: OutputFormat; label: string; extension: string; lossy: boolean }> = [
  { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', lossy: true },
  { value: 'image/webp', label: 'WebP', extension: 'webp', lossy: true },
  { value: 'image/png', label: 'PNG', extension: 'png', lossy: false },
]

/** Maior arquivo aceito (MB), para o navegador não travar. */
export const MAX_FILE_MB = 25

/** Maior lado aceito na saída (px). */
export const MAX_SIDE = 8000

export interface Size {
  width: number
  height: number
}

/** Reduz mantendo a proporção até caber em `maxWidth` (0 ou vazio = sem limite). Nunca aumenta a imagem. */
export function fitWidth(size: Size, maxWidth: number): Size {
  if (!(maxWidth > 0) || size.width <= maxWidth) return { width: size.width, height: size.height }
  const scale = maxWidth / size.width
  return { width: maxWidth, height: Math.max(1, Math.round(size.height * scale)) }
}

/** "1,2 MB", "340 kB", "512 B". */
export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
  if (bytes < 1_000_000) return `${number.format(bytes / 1000)} kB`
  return `${number.format(bytes / 1_000_000)} MB`
}

export const extensionFor = (format: OutputFormat): string => FORMATS.find((item) => item.value === format)?.extension ?? 'jpg'

/** "foto.png" + JPEG vira "foto-comprimida.jpg". */
export function outputName(original: string, format: OutputFormat): string {
  const dot = original.lastIndexOf('.')
  const base = (dot > 0 ? original.slice(0, dot) : original).trim() || 'imagem'
  return `${base}-comprimida.${extensionFor(format)}`
}

/** Variação do tamanho em %, negativa quando diminuiu: de 100 kB para 40 kB é -60. */
export const sizeChangePercent = (before: number, after: number): number => (before <= 0 ? 0 : Math.round(((after - before) / before) * 100))

/** Tipos que o navegador abre sozinho. */
export const isSupportedImage = (type: string): boolean => /^image\/(jpeg|png|webp|gif|bmp|avif)$/.test(type)
