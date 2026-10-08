import { describe, expect, it } from 'vitest'
import { applyTransform, fromBase64, removeAccents, toBase64, TRANSFORMS, words, type TransformId } from '@/modules/text-tools/lib/text'

const value = (id: TransformId, text: string) => {
  const result = applyTransform(id, text)
  if (!result.ok) throw new Error(result.error)
  return result.value
}

describe('maiúsculas e minúsculas', () => {
  it('troca a caixa respeitando acentos', () => {
    expect(value('upper', 'ação é boa')).toBe('AÇÃO É BOA')
    expect(value('lower', 'AÇÃO É BOA')).toBe('ação é boa')
  })

  it('capitaliza cada palavra', () => {
    expect(value('title', 'o rato roeu a roupa')).toBe('O Rato Roeu A Roupa')
    expect(value('title', "d'água ÉPICA")).toBe("D'água Épica")
  })

  it('capitaliza só o começo das frases', () => {
    expect(value('sentence', 'OLÁ. como vai? bem!\noutra linha')).toBe('Olá. Como vai? Bem!\nOutra linha')
  })
})

describe('programação', () => {
  it('separa palavras também por mudança de caixa', () => {
    expect(words('fooBar-baz_qux 9')).toEqual(['foo', 'Bar', 'baz', 'qux', '9'])
  })

  it('converte para camel, snake e kebab', () => {
    expect(value('camel', 'Minha variável nova')).toBe('minhaVariavelNova')
    expect(value('snake', 'Minha variável nova')).toBe('minha_variavel_nova')
    expect(value('kebab', 'minhaVariavelNova')).toBe('minha-variavel-nova')
  })

  it('gera slug sem acento nem símbolo', () => {
    expect(value('slug', '  Promoção: 50% de desconto!  ')).toBe('promocao-50-de-desconto')
  })

  it('tira acentos', () => {
    expect(removeAccents('coração, ação, à')).toBe('coracao, acao, a')
  })
})

describe('linhas', () => {
  it('tira linhas em branco', () => {
    expect(value('trim-lines', 'a\n\n  \nb\r\nc')).toBe('a\nb\nc')
  })

  it('tira repetidas mantendo a primeira', () => {
    expect(value('unique-lines', 'b\na\nb\na\nc')).toBe('b\na\nc')
  })

  it('ordena em português e inverte', () => {
    expect(value('sort-lines', 'z\nárvore\nb\na')).toBe('a\nárvore\nb\nz')
    expect(value('reverse-lines', '1\n2\n3')).toBe('3\n2\n1')
  })
})

describe('codificação', () => {
  it('faz o ciclo de Base64 com acentos e emoji', () => {
    const text = 'Olá, mundo! 👍'
    expect(toBase64('Olá')).toBe('T2zDoQ==')
    expect(fromBase64(toBase64(text))).toBe(text)
  })

  it('decodifica Base64 para URL e com quebras de linha', () => {
    expect(fromBase64('T2zD\noQ')).toBe('Olá')
    expect(fromBase64('PDw_Pz4-')).toBe('<<??>>')
  })

  it('avisa quando o Base64 é inválido', () => {
    expect(applyTransform('base64-decode', '@@@')).toEqual({ ok: false, error: 'Esse texto não é um Base64 válido.' })
  })

  it('codifica e decodifica URL', () => {
    expect(value('url-encode', 'a b&c=ç')).toBe('a%20b%26c%3D%C3%A7')
    expect(value('url-decode', 'a%20b%26c%3D%C3%A7')).toBe('a b&c=ç')
    expect(applyTransform('url-decode', '%E0%A4%A').ok).toBe(false)
  })
})

describe('lista', () => {
  it('tem ids únicos', () => {
    const ids = TRANSFORMS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
