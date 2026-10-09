/**
 * Avatar "beam" (rosto abstrato), portado do Boring Avatars (https://github.com/boringdesigners/boring-avatars, licença MIT).
 * O desenho sai todo do nome: o mesmo nome gera sempre o mesmo rosto, e a paleta também é escolhida pelo nome.
 */

/** Lado do desenho, em unidades do viewBox. */
export const SIZE = 36

/** Paletas de 5 cores; cada pessoa pega uma, para os avatares saírem variados. */
export const PALETTES: readonly (readonly string[])[] = [
  ['#2457F5', '#7C9BFF', '#F2B600', '#E5322D', '#0E1420'],
  ['#C2255C', '#FF7AA2', '#FFD3E0', '#6D4AE0', '#2A0A14'],
  ['#0F766E', '#4FD1C5', '#FDE68A', '#F97316', '#134E4A'],
  ['#6D4AE0', '#A78BFA', '#FBCFE8', '#14B8A6', '#1E1B4B'],
  ['#B45309', '#F5B14C', '#FEF3C7', '#0EA5E9', '#3B1D00'],
  ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
  ['#5D3FD3', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
  ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#E0FBFC'],
]

export function hashCode(name: string): number {
  let hash = 0
  for (let index = 0; index < name.length; index++) {
    hash = (hash << 5) - hash + name.charCodeAt(index)
    hash &= hash
  }
  return Math.abs(hash)
}

const digit = (number: number, place: number): number => Math.floor((number / 10 ** place) % 10)
const isEven = (number: number, place: number): boolean => digit(number, place) % 2 === 0
const unit = (number: number, range: number, place?: number): number => {
  const value = number % range
  return place && digit(number, place) % 2 === 0 ? -value : value
}
const pick = (number: number, colors: readonly string[]): string => colors[number % colors.length]

/** Preto ou branco, o que dá mais contraste sobre a cor (fórmula YIQ). */
export function contrastOn(hex: string): string {
  const clean = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((start) => parseInt(clean.slice(start, start + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000000' : '#FFFFFF'
}

export const paletteFor = (name: string): readonly string[] => PALETTES[hashCode(`${name}#palette`) % PALETTES.length]

export interface Beam {
  background: string
  wrapper: string
  face: string
  wrapperTranslateX: number
  wrapperTranslateY: number
  wrapperRotate: number
  wrapperScale: number
  isMouthOpen: boolean
  isCircle: boolean
  eyeSpread: number
  mouthSpread: number
  faceRotate: number
  faceTranslateX: number
  faceTranslateY: number
}

/** Todas as medidas do rosto, a partir do nome. */
export function beam(name: string, colors: readonly string[] = paletteFor(name)): Beam {
  const number = hashCode(name)
  const wrapper = pick(number, colors)
  const preX = unit(number, 10, 1)
  const wrapperTranslateX = preX < 5 ? preX + SIZE / 9 : preX
  const preY = unit(number, 10, 2)
  const wrapperTranslateY = preY < 5 ? preY + SIZE / 9 : preY
  return {
    background: pick(number + 13, colors),
    wrapper,
    face: contrastOn(wrapper),
    wrapperTranslateX,
    wrapperTranslateY,
    wrapperRotate: unit(number, 360),
    wrapperScale: 1 + unit(number, SIZE / 12) / 10,
    isMouthOpen: isEven(number, 2),
    isCircle: isEven(number, 1),
    eyeSpread: unit(number, 5),
    mouthSpread: unit(number, 3),
    faceRotate: unit(number, 10, 3),
    faceTranslateX: wrapperTranslateX > SIZE / 6 ? wrapperTranslateX / 2 : unit(number, 8, 1),
    faceTranslateY: wrapperTranslateY > SIZE / 6 ? wrapperTranslateY / 2 : unit(number, 7, 2),
  }
}

/** O avatar como arquivo SVG (quadrado), para baixar ou usar em outro sistema. */
export function beamSvg(name: string, pixels = 256): string {
  const b = beam(name)
  const mouth = b.isMouthOpen
    ? `<path d="M15 ${19 + b.mouthSpread}c2 1 4 1 6 0" stroke="${b.face}" fill="none" stroke-linecap="round"/>`
    : `<path d="M13,${19 + b.mouthSpread} a1,0.75 0 0,0 10,0" fill="${b.face}"/>`
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${pixels}" height="${pixels}" fill="none">`,
    `<rect width="${SIZE}" height="${SIZE}" fill="${b.background}"/>`,
    `<rect width="${SIZE}" height="${SIZE}" transform="translate(${b.wrapperTranslateX} ${b.wrapperTranslateY}) rotate(${b.wrapperRotate} ${SIZE / 2} ${SIZE / 2}) scale(${b.wrapperScale})" fill="${b.wrapper}" rx="${b.isCircle ? SIZE : SIZE / 6}"/>`,
    `<g transform="translate(${b.faceTranslateX} ${b.faceTranslateY}) rotate(${b.faceRotate} ${SIZE / 2} ${SIZE / 2})">`,
    mouth,
    `<rect x="${14 - b.eyeSpread}" y="14" width="1.5" height="2" rx="1" fill="${b.face}"/>`,
    `<rect x="${20 + b.eyeSpread}" y="14" width="1.5" height="2" rx="1" fill="${b.face}"/>`,
    '</g></svg>',
  ].join('')
}
