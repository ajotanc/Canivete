import { compileTemplate, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

// Pega erro de sintaxe de template (tag sobrando, atributo quebrado) que o vue-tsc deixa passar e só o build acusa.
const files = import.meta.glob('/src/**/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('templates dos componentes', () => {
  it('encontra os componentes', () => {
    expect(Object.keys(files).length).toBeGreaterThan(50)
  })

  it.each(Object.entries(files))('%s compila sem erro', (path, source) => {
    const { descriptor, errors } = parse(source, { filename: path })
    expect(errors.map((error) => error.message)).toEqual([])
    if (!descriptor.template) return
    const result = compileTemplate({ source: descriptor.template.content, filename: path, id: path })
    expect(result.errors.map((error) => (typeof error === 'string' ? error : error.message))).toEqual([])
  })
})
