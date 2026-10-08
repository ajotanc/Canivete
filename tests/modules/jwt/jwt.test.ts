import { webcrypto } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { base64UrlToBytes, cleanToken, decodeJwt, describeClaims, expiryOf, relative, verifyJwt, type Decoded } from '@/modules/jwt/lib/jwt'

const subtle = webcrypto.subtle as SubtleCrypto

// Exemplo clássico do jwt.io: HS256, chave "your-256-bit-secret".
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function decoded(token = TOKEN): Decoded {
  const result = decodeJwt(token)
  if (!result.ok) throw new Error(result.error)
  return result.token
}

describe('decodeJwt', () => {
  it('lê cabeçalho e conteúdo do exemplo', () => {
    const { header, payload, parts } = decoded()
    expect(header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 })
    expect(parts).toHaveLength(3)
  })

  it('aceita Bearer, espaços e quebras de linha', () => {
    expect(cleanToken(`  Bearer ${TOKEN.slice(0, 20)}\n${TOKEN.slice(20)}  `)).toBe(TOKEN)
    expect(decodeJwt(`Bearer ${TOKEN}`).ok).toBe(true)
  })

  it('lê acentos e emoji no conteúdo (UTF-8)', () => {
    const payload = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify({ nome: 'Ação 👍' })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const result = decodeJwt(`eyJhbGciOiJub25lIn0.${payload}.`)
    expect(result.ok && result.token.payload.nome).toBe('Ação 👍')
  })

  it('explica cada erro em português', () => {
    expect(decodeJwt('')).toEqual({ ok: false, error: 'Cole um token.' })
    expect(decodeJwt('abc.def')).toEqual({ ok: false, error: 'Um JWT tem 3 partes separadas por ponto; este tem 2.' })
    expect(decodeJwt('@@@.eyJhIjoxfQ.x')).toMatchObject({ ok: false, error: 'O cabeçalho não é um JSON válido em Base64.' })
    expect(decodeJwt('eyJhbGciOiJub25lIn0.@@@.x')).toMatchObject({ ok: false, error: 'O conteúdo não é um JSON válido em Base64.' })
    // "[1]" em Base64 é um JSON válido, mas não é objeto.
    expect(decodeJwt(`${btoa('[1]')}.eyJhIjoxfQ.x`)).toMatchObject({ ok: false, error: 'O cabeçalho precisa ser um objeto JSON.' })
  })
})

describe('base64UrlToBytes', () => {
  it('lê o alfabeto da URL e o preenchimento ausente', () => {
    expect(new TextDecoder().decode(base64UrlToBytes('PDw_Pz4-'))).toBe('<<??>>')
    expect(new TextDecoder().decode(base64UrlToBytes('T2zDoQ'))).toBe('Olá')
    expect(Array.from(base64UrlToBytes('YQ'))).toEqual([97])
  })
})

describe('expiryOf', () => {
  it('sem exp o token não expira', () => {
    expect(expiryOf({}, 1000)).toBe('no-expiry')
  })

  it('compara exp e nbf com a hora atual', () => {
    expect(expiryOf({ exp: 2000 }, 1000)).toBe('valid')
    expect(expiryOf({ exp: 1000 }, 1000)).toBe('expired')
    expect(expiryOf({ exp: 500 }, 1000)).toBe('expired')
    expect(expiryOf({ nbf: 2000, exp: 3000 }, 1000)).toBe('not-yet')
    expect(expiryOf({ nbf: 500, exp: 3000 }, 1000)).toBe('valid')
  })

  it('ignora datas que não são número', () => {
    expect(expiryOf({ exp: '2000' }, 1000)).toBe('no-expiry')
  })
})

describe('relative', () => {
  it.each([
    [0, 'agora'],
    [-30, 'há 30 segundos'],
    [90, 'em 2 minutos'],
    [-3600, 'há 1 hora'],
    [7200, 'em 2 horas'],
    [-86_400 * 3, 'há 3 dias'],
    [86_400 * 60, 'em 2 meses'],
    [-31_536_000 * 2, 'há 2 anos'],
  ])('%i s é "%s"', (delta, text) => {
    expect(relative(delta)).toBe(text)
  })
})

describe('describeClaims', () => {
  it('explica os campos padrão e formata as datas', () => {
    const now = 1_516_239_022 + 3600
    const claims = describeClaims({ iss: 'canivete', sub: '42', aud: ['a', 'b'], iat: 1_516_239_022, exp: now + 86_400 }, now)
    expect(claims.map((claim) => claim.name)).toEqual(['iss', 'sub', 'aud', 'exp', 'iat'].sort((a, b) => ['iss', 'sub', 'aud', 'jti', 'exp', 'iat', 'nbf'].indexOf(a) - ['iss', 'sub', 'aud', 'jti', 'exp', 'iat', 'nbf'].indexOf(b)))
    expect(claims.find((claim) => claim.name === 'aud')?.value).toBe('a, b')
    expect(claims.find((claim) => claim.name === 'iat')?.date?.relative).toBe('há 1 hora')
    expect(claims.find((claim) => claim.name === 'exp')?.date?.relative).toBe('em 1 dia')
  })

  it('sem campos padrão devolve lista vazia', () => {
    expect(describeClaims({ foo: 1 }, 0)).toEqual([])
  })
})

describe('verifyJwt', () => {
  it('confere a assinatura do exemplo com a chave certa', async () => {
    expect(await verifyJwt(decoded(), 'your-256-bit-secret', subtle)).toBe('valid')
  })

  it('chave errada ou conteúdo alterado dá inválido', async () => {
    expect(await verifyJwt(decoded(), 'outra-chave', subtle)).toBe('invalid')
    const parts = TOKEN.split('.')
    const forged = `${parts[0]}.${btoa(JSON.stringify({ sub: 'admin' })).replace(/=+$/, '')}.${parts[2]}`
    expect(await verifyJwt(decoded(forged), 'your-256-bit-secret', subtle)).toBe('invalid')
  })

  it('outros algoritmos não são conferidos', async () => {
    const none = decoded('eyJhbGciOiJub25lIn0.eyJhIjoxfQ.')
    expect(await verifyJwt(none, 'x', subtle)).toBe('unsupported')
  })

  it('assinatura em Base64 inválido dá inválido, sem lançar erro', async () => {
    const broken = decoded()
    broken.parts[2] = '@@@'
    expect(await verifyJwt(broken, 'your-256-bit-secret', subtle)).toBe('invalid')
  })
})
