import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CATEGORIES, categoryKey, toolColor } from '@/core/modules/categories'
import { tools } from '@/core/modules/registry'

const css = readFileSync('src/style.css', 'utf8')
const block = (selector: string) => css.slice(css.indexOf(`${selector} {`), css.indexOf('}', css.indexOf(`${selector} {`)))
const colorIn = (scope: string, key: string) => new RegExp(`--cat-${key}:\\s*(#[0-9a-f]{6})`, 'i').exec(block(scope))?.[1]

/** Contraste WCAG entre duas cores #rrggbb. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, b2] = [1, 3, 5].map((start) => {
      const v = parseInt(hex.slice(start, start + 2), 16) / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** A cor a `alpha` por cima de um fundo, como o `bg-category/12` faz. */
function over(color: string, base: string, alpha: number): string {
  const channel = (hex: string, start: number) => parseInt(hex.slice(start, start + 2), 16)
  return `#${[1, 3, 5].map((start) => Math.round(channel(color, start) * alpha + channel(base, start) * (1 - alpha)).toString(16).padStart(2, '0')).join('')}`
}

describe('categorias', () => {
  it('toda ferramenta está numa categoria conhecida', () => {
    for (const tool of tools) expect(categoryKey(tool.category), `${tool.id}: ${tool.category}`).not.toBe('other')
  })

  it('a cor da ferramenta é a da categoria, e toda categoria vira uma cor de ferramenta no CSS', () => {
    for (const tool of tools) expect(toolColor(tool)).toBe(categoryKey(tool.category))
    for (const item of CATEGORIES) expect(css, item.key).toContain(`[data-tool='${item.key}'] { --tool: var(--cat-${item.key}); --tool-foreground: var(--cat-foreground); }`)
  })

  it.each(CATEGORIES.map((item) => item.key))('"%s" tem cor no tema claro e no escuro, com contraste para o texto da tag', (key) => {
    const light = colorIn(':root', key)
    const dark = colorIn('.dark', key)
    expect(light).toBeDefined()
    expect(dark).toBeDefined()
    // Tag: texto na cor da categoria sobre o próprio tom a 12% por cima do card (branco no claro, grafite no escuro).
    expect(contrast(light!, over(light!, '#FFFFFF', 0.12))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(dark!, over(dark!, '#18212F', 0.12))).toBeGreaterThanOrEqual(4.5)
    // Faixa do card e botões da página: texto (branco no claro, grafite no escuro) sobre a cor cheia.
    expect(contrast(light!, colorIn(':root', 'foreground')!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(dark!, colorIn('.dark', 'foreground')!)).toBeGreaterThanOrEqual(4.5)
  })
})
