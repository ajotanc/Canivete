export interface Rgb {
  r: number
  g: number
  b: number
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))
const byte = (value: number): number => clamp(Math.round(value), 0, 255)

/** Aceita "#abc", "#aabbcc" (com ou sem #), "rgb(1, 2, 3)" e "hsl(120, 50%, 40%)". Outra coisa devolve null. */
export function parseColor(text: string): Rgb | null {
  const input = text.trim().toLowerCase()

  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(input)
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((char) => char + char).join('') : hex[1]
    return { r: parseInt(digits.slice(0, 2), 16), g: parseInt(digits.slice(2, 4), 16), b: parseInt(digits.slice(4, 6), 16) }
  }

  const rgb = /^rgb\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)$/.exec(input)
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number)
    return r > 255 || g > 255 || b > 255 ? null : { r, g, b }
  }

  const hsl = /^hsl\(\s*(\d{1,3})(?:deg)?\s*[, ]\s*(\d{1,3})%\s*[, ]\s*(\d{1,3})%\s*\)$/.exec(input)
  if (hsl) {
    const [h, s, l] = [hsl[1], hsl[2], hsl[3]].map(Number)
    return h > 360 || s > 100 || l > 100 ? null : hslToRgb(h, s, l)
  }

  return null
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const delta = max - min
  if (delta === 0) return { h: 0, s: 0, l: Math.round(l * 100) }
  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn - bn) / delta) % 6
  else if (max === gn) h = (bn - rn) / delta + 2
  else h = (rn - gn) / delta + 4
  return { h: Math.round((h * 60 + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const [sn, ln] = [s / 100, l / 100]
  const chroma = (1 - Math.abs(2 * ln - 1)) * sn
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - chroma / 2
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x]
  return { r: byte((r + m) * 255), g: byte((g + m) * 255), b: byte((b + m) * 255) }
}

export const toHex = ({ r, g, b }: Rgb): string => `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
export const toRgbString = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`
export function toHslString(rgb: Rgb): string {
  const { h, s, l } = rgbToHsl(rgb)
  return `hsl(${h}, ${s}%, ${l}%)`
}

/** Luminância relativa (WCAG), de 0 (preto) a 1 (branco). */
export function luminance({ r, g, b }: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

/** Contraste entre duas cores, de 1 a 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export interface Wcag {
  ratio: number
  aa: boolean
  aaLarge: boolean
  aaa: boolean
  aaaLarge: boolean
}

/** Níveis WCAG 2.x: texto normal AA 4,5 e AAA 7; texto grande AA 3 e AAA 4,5. */
export function wcag(foreground: Rgb, background: Rgb): Wcag {
  const ratio = contrastRatio(foreground, background)
  return { ratio, aa: ratio >= 4.5, aaLarge: ratio >= 3, aaa: ratio >= 7, aaaLarge: ratio >= 4.5 }
}

/** Preto ou branco, o que ler melhor sobre a cor. */
export function readableOn(background: Rgb): Rgb {
  const black = { r: 0, g: 0, b: 0 }
  const white = { r: 255, g: 255, b: 255 }
  return contrastRatio(black, background) >= contrastRatio(white, background) ? black : white
}

/** Tons mais claros e mais escuros da cor, mexendo só na luminosidade (HSL). */
export function shades(rgb: Rgb, steps = [90, 80, 70, 60, 50, 40, 30, 20, 10]): Rgb[] {
  const { h, s } = rgbToHsl(rgb)
  return steps.map((l) => hslToRgb(h, s, l))
}
