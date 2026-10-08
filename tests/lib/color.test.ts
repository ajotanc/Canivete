import { describe, expect, it } from 'vitest'
import { contrastRatio, hslToRgb, luminance, parseColor, readableOn, rgbToHsl, shades, toHex, toHslString, toRgbString, wcag } from '@/lib/color'

const black = { r: 0, g: 0, b: 0 }
const white = { r: 255, g: 255, b: 255 }

describe('parseColor', () => {
  it('lê hexadecimal curto e longo, com ou sem #', () => {
    expect(parseColor('#fff')).toEqual(white)
    expect(parseColor('1A2b3C')).toEqual({ r: 26, g: 43, b: 60 })
    expect(parseColor('  #000000 ')).toEqual(black)
  })

  it('lê rgb() e hsl()', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 })
    expect(parseColor('rgb(10 20 30)')).toEqual({ r: 10, g: 20, b: 30 })
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('hsl(120deg 100% 25%)')).toEqual({ r: 0, g: 128, b: 0 })
  })

  it('rejeita o que não é cor', () => {
    expect(parseColor('')).toBeNull()
    expect(parseColor('#ggg')).toBeNull()
    expect(parseColor('#12345')).toBeNull()
    expect(parseColor('rgb(300, 0, 0)')).toBeNull()
    expect(parseColor('hsl(400, 10%, 10%)')).toBeNull()
    expect(parseColor('vermelho')).toBeNull()
  })
})

describe('conversões', () => {
  it('formata hex em maiúsculas, rgb e hsl', () => {
    const color = { r: 26, g: 43, b: 60 }
    expect(toHex(color)).toBe('#1A2B3C')
    expect(toRgbString(color)).toBe('rgb(26, 43, 60)')
    expect(toHslString(color)).toBe('hsl(210, 40%, 17%)')
  })

  it('RGB e HSL fazem o caminho de ida e volta', () => {
    for (const color of [{ r: 255, g: 0, b: 0 }, { r: 12, g: 200, b: 99 }, { r: 120, g: 120, b: 120 }, white, black]) {
      const { h, s, l } = rgbToHsl(color)
      const back = hslToRgb(h, s, l)
      expect(Math.abs(back.r - color.r)).toBeLessThanOrEqual(3)
      expect(Math.abs(back.g - color.g)).toBeLessThanOrEqual(3)
      expect(Math.abs(back.b - color.b)).toBeLessThanOrEqual(3)
    }
  })

  it('cinza não tem matiz nem saturação', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 })
  })
})

describe('contraste', () => {
  it('preto sobre branco é 21 e a mesma cor é 1', () => {
    expect(luminance(white)).toBe(1)
    expect(luminance(black)).toBe(0)
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5)
    expect(contrastRatio(white, white)).toBe(1)
  })

  it('classifica os níveis WCAG', () => {
    const grayOnWhite = wcag({ r: 119, g: 119, b: 119 }, white) // #777: 4,48
    expect(grayOnWhite.ratio).toBeCloseTo(4.48, 1)
    expect(grayOnWhite).toMatchObject({ aa: false, aaLarge: true, aaa: false, aaaLarge: false })
    expect(wcag(black, white)).toMatchObject({ aa: true, aaa: true, aaLarge: true, aaaLarge: true })
  })

  it('escolhe preto ou branco para ler sobre a cor', () => {
    expect(readableOn(white)).toEqual(black)
    expect(readableOn({ r: 10, g: 20, b: 60 })).toEqual(white)
    expect(readableOn({ r: 255, g: 255, b: 0 })).toEqual(black)
  })
})

describe('shades', () => {
  it('mantém o matiz e vai do claro ao escuro', () => {
    const list = shades({ r: 200, g: 40, b: 40 })
    expect(list).toHaveLength(9)
    expect(luminance(list[0])).toBeGreaterThan(luminance(list[8]))
  })
})
