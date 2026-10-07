import { GROUP_COLORS, type GroupColor } from './api'

export const COLOR_LABELS: Record<GroupColor, string> = {
  berry: 'Framboesa',
  cobalt: 'Cobalto',
  pine: 'Pinho',
  violet: 'Violeta',
  amber: 'Âmbar',
}

export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

export const colorLabel = (color: string) => (isHexColor(color) ? `Cor ${color.toUpperCase()}` : (COLOR_LABELS[color as GroupColor] ?? COLOR_LABELS.berry))

/** Luminância relativa (WCAG) de #RRGGBB. */
export function hexLuminance(hex: string): number {
  const channel = (start: number) => {
    const v = parseInt(hex.slice(start, start + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** Mensagem quando a cor livre não dá contraste com o texto branco; null se serve. */
export function colorProblem(hex: string): string | null {
  const luminance = hexLuminance(hex)
  if (luminance > 0.3) return 'Essa cor é clara demais. Escolha uma mais escura.'
  if (luminance < 0.02) return 'Essa cor é escura demais. Escolha uma mais clara.'
  return null
}

/** Aplica a cor do grupo à página inteira (cabeçalho, botões, foco). Cor desconhecida vale framboesa. */
export function applyGroupColor(color: string | null | undefined): void {
  const root = document.documentElement
  if (color && isHexColor(color)) {
    root.style.setProperty('--custom', color)
    root.dataset.tool = 'custom'
    return
  }
  root.style.removeProperty('--custom')
  root.dataset.tool = (GROUP_COLORS as readonly string[]).includes(color ?? '') ? color! : 'berry'
}
