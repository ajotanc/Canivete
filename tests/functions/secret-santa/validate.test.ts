import { describe, expect, it } from 'vitest'
import { SantaError } from '../../../functions/secret-santa/src/lib/errors'
import {
  cleanLine,
  parseBudget,
  parseEventDate,
  parseGroupId,
  parseGroupName,
  parsePersonName,
  parsePin,
  decodeWish,
  parseWishlist,
  toNameKey,
} from '../../../functions/secret-santa/src/lib/validate'

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (error) {
    return (error as SantaError).code
  }
  return undefined
}

describe('toNameKey', () => {
  it('ignora caixa, espaços nas pontas e espaços repetidos', () => {
    expect(toNameKey('  JOÃO   da  Silva ')).toBe('joão da silva')
  })

  it('mantém acento (João e Joao são nomes diferentes)', () => {
    expect(toNameKey('João')).not.toBe(toNameKey('Joao'))
  })

  it('normaliza formas Unicode equivalentes (NFC)', () => {
    expect(toNameKey('João')).toBe(toNameKey('João'))
  })
})

describe('cleanLine', () => {
  it('devolve texto vazio para valores que não são texto', () => {
    expect(cleanLine(42)).toBe('')
    expect(cleanLine(undefined)).toBe('')
  })
})

describe('parseGroupName', () => {
  it('aceita 1 a 80 caracteres e limpa espaços', () => {
    expect(parseGroupName('  Família   Silva ')).toBe('Família Silva')
    expect(parseGroupName('x'.repeat(80))).toHaveLength(80)
  })

  it.each(['', '   ', 'x'.repeat(81), 123, null])('rejeita %j', (value) => {
    expect(codeOf(() => parseGroupName(value))).toBe('INVALID_INPUT')
  })
})

describe('parseBudget', () => {
  it('aceita vazio (null) e valores em reais de 0 a 1.000.000', () => {
    expect(parseBudget(undefined)).toBeNull()
    expect(parseBudget('')).toBeNull()
    expect(parseBudget(50)).toBe(50)
    expect(parseBudget('49,9')).toBe(49.9)
    expect(parseBudget(10.456)).toBe(10.46)
    expect(codeOf(() => parseBudget(-1))).toBe('INVALID_INPUT')
    expect(codeOf(() => parseBudget('abc'))).toBe('INVALID_INPUT')
    expect(codeOf(() => parseBudget(1_000_001))).toBe('INVALID_INPUT')
  })
})

describe('parseEventDate', () => {
  it('aceita vazio e datas reais no formato AAAA-MM-DD', () => {
    expect(parseEventDate(undefined)).toBe('')
    expect(parseEventDate('2026-12-24')).toBe('2026-12-24')
  })

  it.each(['24/12/2026', '2026-13-01', '2026-02-30', 'amanhã'])('rejeita %s', (value) => {
    expect(codeOf(() => parseEventDate(value))).toBe('INVALID_INPUT')
  })
})

describe('parsePersonName', () => {
  it('aceita 1 a 60 caracteres', () => {
    expect(parsePersonName(' Ana ')).toBe('Ana')
    expect(codeOf(() => parsePersonName(''))).toBe('INVALID_INPUT')
    expect(codeOf(() => parsePersonName('x'.repeat(61)))).toBe('INVALID_INPUT')
  })
})

describe('parsePin', () => {
  it.each(['1234', '12345', '123456', '0000'])('aceita %s', (pin) => {
    expect(parsePin(pin)).toBe(pin)
  })

  it.each(['123', '1234567', '12a4', '12 34', '', ' 1234', 1234, null, undefined])(
    'rejeita %j',
    (pin) => {
      expect(codeOf(() => parsePin(pin))).toBe('INVALID_INPUT')
    },
  )
})

describe('parseWishlist', () => {
  it('devolve lista limpa, sem vazios nem repetidos, ou null', () => {
    expect(parseWishlist(undefined)).toBeNull()
    expect(parseWishlist([' ', ''])).toBeNull()
    expect(parseWishlist([' livro ', 'Livro', 'meias'])).toEqual(['livro', 'meias'])
    expect(parseWishlist(' livro\nmeias ')).toEqual(['livro', 'meias'])
  })

  it('limita o tamanho do item e a quantidade de itens', () => {
    expect(codeOf(() => parseWishlist(['x'.repeat(101)]))).toBe('INVALID_INPUT')
    expect(codeOf(() => parseWishlist(Array.from({ length: 11 }, (_, i) => `item ${i}`)))).toBe('INVALID_INPUT')
  })
})

describe('parseWishlist com link', () => {
  it('guarda o link normalizado e devolve texto e link separados', () => {
    const [stored, plain] = parseWishlist([{ text: ' Meias ', url: 'loja.com/meias' }, { text: 'Livro', url: '' }])!
    expect(decodeWish(stored!)).toEqual({ text: 'Meias', url: 'https://loja.com/meias' })
    expect(decodeWish(plain!)).toEqual({ text: 'Livro' })
  })

  it('só aceita http e https e limita o tamanho do link', () => {
    expect(codeOf(() => parseWishlist([{ text: 'a', url: 'javascript:alert(1)' }]))).toBe('INVALID_INPUT')
    expect(codeOf(() => parseWishlist([{ text: 'a', url: 'https://x.com/' + 'a'.repeat(500) }]))).toBe('INVALID_INPUT')
    expect(codeOf(() => parseWishlist([{ text: 'a', url: 'http://' }]))).toBe('INVALID_INPUT')
  })
})

describe('parseGroupId', () => {
  it('aceita ids no formato do Appwrite', () => {
    expect(parseGroupId('abc123.X_-y')).toBe('abc123.X_-y')
  })

  it.each(['', 'a/b', '-inicio', 'x'.repeat(37), 'com espaço', 42, undefined])(
    'devolve GROUP_NOT_FOUND para %j',
    (value) => {
      expect(codeOf(() => parseGroupId(value))).toBe('GROUP_NOT_FOUND')
    },
  )
})
