import QRCode from 'qrcode'

export interface QrOptions {
  /** Cor dos módulos (quadradinhos). Padrão: preto. */
  dark?: string
  /** Cor do fundo. Padrão: branco. */
  light?: string
}

const BASE = { margin: 2, errorCorrectionLevel: 'M' } as const

function colors({ dark = '#000000', light = '#ffffff' }: QrOptions) {
  return { dark, light }
}

/** QR Code como texto SVG, para exibir na tela e baixar. Lança erro se o conteúdo for grande demais. */
export function qrSvg(text: string, options: QrOptions = {}): Promise<string> {
  return QRCode.toString(text, { ...BASE, type: 'svg', color: colors(options) })
}

/** QR Code como imagem PNG (data URL) com a largura pedida, em pixels. */
export function qrPng(text: string, options: QrOptions & { width?: number } = {}): Promise<string> {
  return QRCode.toDataURL(text, { ...BASE, width: options.width ?? 1024, color: colors(options) })
}

/** Dispara o download de um arquivo a partir de uma URL (data: ou blob:). */
export function downloadUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
}

/** Baixa um texto como arquivo. */
export function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  downloadUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
