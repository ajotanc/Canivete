import { LIMITS } from '../constants'

/**
 * Imagem de capa do grupo: a foto escolhida vira um WebP reduzido no próprio navegador antes de subir.
 * O cabeçalho é largo e baixo, então basta uma imagem de até 1600 x 1000; a Function confere o formato e o tamanho.
 */
export const COVER = {
  maxWidth: 1600,
  maxHeight: 1000,
  /** Qualidade inicial do WebP; desce em passos até caber em `LIMITS.coverBytes`. */
  quality: 0.82,
  minQuality: 0.5,
  qualityStep: 0.1,
  /** Foto original aceita para converter, em MB (a convertida é bem menor). */
  maxInputMb: 25,
} as const

export interface Size {
  width: number
  height: number
}

/** Cabe a imagem dentro do retângulo máximo sem distorcer; imagem menor fica como está. */
export function fitInside(size: Size, max: Size = { width: COVER.maxWidth, height: COVER.maxHeight }): Size {
  const scale = Math.min(1, max.width / size.width, max.height / size.height)
  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) }
}

/** Mensagem para a foto que nem chega a ser convertida; null quando dá para seguir. */
export function coverFileProblem(file: { type: string; size: number }): string | null {
  if (!/^image\/(jpeg|png|webp|gif|bmp|avif|heic|heif)$/.test(file.type)) return 'Escolha uma foto em JPG, PNG ou WebP.'
  if (file.size > COVER.maxInputMb * 1024 * 1024) return `Essa foto é grande demais. Use uma de até ${COVER.maxInputMb} MB.`
  return null
}

/** Primeiros bytes de um WebP: "RIFF", tamanho, "WEBP". */
async function isWebp(blob: Blob): Promise<boolean> {
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  const text = (start: number) => String.fromCharCode(...head.slice(start, start + 4))
  return text(0) === 'RIFF' && text(8) === 'WEBP'
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

/**
 * Codifica em WebP. O canvas do navegador resolve quase sempre; o Safari devolve PNG no lugar,
 * e aí entra um codificador em WebAssembly, carregado só nessa hora.
 */
async function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const native = await canvasToBlob(canvas, quality)
  if (native && (await isWebp(native))) return native
  const { default: encode } = await import('@jsquash/webp/encode')
  const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
  return new Blob([await encode(pixels, { quality: Math.round(quality * 100) })], { type: 'image/webp' })
}

/** Converte a foto escolhida no WebP da capa, reduzindo o tamanho e a qualidade até caber no limite. */
export async function toCoverWebp(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Não foi possível abrir essa foto neste navegador. Tente uma em JPG ou PNG.')
  }
  const size = fitInside({ width: bitmap.width, height: bitmap.height })
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível preparar a imagem neste navegador.')
  context.drawImage(bitmap, 0, 0, size.width, size.height)
  bitmap.close()

  for (let quality: number = COVER.quality; quality >= COVER.minQuality - 0.001; quality -= COVER.qualityStep) {
    const blob = await encodeWebp(canvas, quality)
    if (blob.size <= LIMITS.coverBytes) return blob
  }
  throw new Error('Não foi possível deixar essa foto leve o bastante. Tente outra.')
}

/** Conteúdo do arquivo em base64, sem o prefixo `data:`. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''))
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(blob)
  })
}
