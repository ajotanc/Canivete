import { describe, expect, it } from 'vitest'
import { formatJson, locate, minifyJson, parseJson, sortKeys, statsOf } from '@/modules/json/lib/json'

describe('parseJson', () => {
  it('lê JSON válido', () => {
    expect(parseJson('{"a": [1, 2, {"b": null}]}')).toEqual({ ok: true, value: { a: [1, 2, { b: null }] } })
  })

  it('texto vazio tem aviso próprio', () => {
    expect(parseJson('   ')).toMatchObject({ ok: false, message: 'O texto está vazio.' })
  })

  it('aponta a linha do erro', () => {
    const result = parseJson('{\n  "a": 1,\n  "b": ,\n  "c": 3\n}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.line).toBe(3)
  })

  it('JSON cortado no fim avisa que falta fechar', () => {
    const result = parseJson('{"a": [1, 2')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/falta fechar|termina antes/)
  })

  it('aspas simples e vírgula sobrando são erros', () => {
    expect(parseJson("{'a': 1}").ok).toBe(false)
    expect(parseJson('{"a": 1,}').ok).toBe(false)
  })
})

describe('locate', () => {
  it('conta linha e coluna a partir de 1', () => {
    expect(locate('ab\ncde', 0)).toEqual({ line: 1, column: 1 })
    expect(locate('ab\ncde', 4)).toEqual({ line: 2, column: 2 })
    expect(locate('ab', 99)).toEqual({ line: 1, column: 3 })
  })
})

describe('formatação', () => {
  const value = { a: 1, b: [true] }

  it('indenta com 2 espaços, 4 espaços ou tab', () => {
    expect(formatJson(value, 2)).toBe('{\n  "a": 1,\n  "b": [\n    true\n  ]\n}')
    expect(formatJson(value, 4).split('\n')[1]).toBe('    "a": 1,')
    expect(formatJson(value, 'tab').split('\n')[1]).toBe('\t"a": 1,')
  })

  it('minifica', () => {
    expect(minifyJson(value)).toBe('{"a":1,"b":[true]}')
  })

  it('ordena as chaves em todos os níveis e mantém a ordem das listas', () => {
    expect(JSON.stringify(sortKeys({ b: 1, a: { z: 1, y: [{ d: 1, c: 2 }, 3] } }))).toBe('{"a":{"y":[{"c":2,"d":1},3],"z":1},"b":1}')
  })
})

describe('statsOf', () => {
  it('conta chaves, profundidade e bytes', () => {
    expect(statsOf({ a: { b: [1, { c: 2 }] } })).toEqual({ type: 'objeto', keys: 3, depth: 4, bytes: 23 })
  })

  it('conta bytes em UTF-8', () => {
    expect(statsOf('é').bytes).toBe(4)
  })

  it('classifica valores simples', () => {
    expect(statsOf([]).type).toBe('lista')
    expect(statsOf(null).type).toBe('nulo')
    expect(statsOf(5)).toMatchObject({ type: 'número', depth: 0, keys: 0 })
    expect(statsOf(true).type).toBe('booleano')
  })
})
