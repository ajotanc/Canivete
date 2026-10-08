import { webcrypto } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { digestHex, generateUuid, hmacHex, uuidV4, uuidV7 } from '@/modules/hash/lib/hash'

const subtle = webcrypto.subtle as SubtleCrypto

describe('UUID', () => {
  it('v4 tem o formato e os bits de versão e variante', () => {
    for (let i = 0; i < 50; i++) expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('v7 começa com os milissegundos e é ordenável', () => {
    const early = uuidV7(1_700_000_000_000)
    const late = uuidV7(1_800_000_000_000)
    expect(early).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(early.replace('-', '').slice(0, 12)).toBe((1_700_000_000_000).toString(16).padStart(12, '0'))
    expect(early < late).toBe(true)
  })

  it('opções de maiúsculas e sem traços', () => {
    expect(generateUuid({ version: 'v4', uppercase: true, dashes: false })).toMatch(/^[0-9A-F]{32}$/)
    expect(generateUuid({ version: 'v7', uppercase: false, dashes: true })).toMatch(/-/)
  })

  it('não repete', () => {
    expect(new Set(Array.from({ length: 200 }, () => uuidV4())).size).toBe(200)
  })
})

describe('hash', () => {
  it('SHA-256 e SHA-1 de "abc" (vetores conhecidos)', async () => {
    expect(await digestHex('SHA-256', 'abc', subtle)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(await digestHex('SHA-1', 'abc', subtle)).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
  })

  it('texto vazio e acentuado (UTF-8)', async () => {
    expect(await digestHex('SHA-256', '', subtle)).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(await digestHex('SHA-1', 'á', subtle)).toBe(await digestHex('SHA-1', 'á', subtle))
    expect(await digestHex('SHA-1', 'á', subtle)).not.toBe(await digestHex('SHA-1', 'a', subtle))
  })

  it('o tamanho do hash segue o algoritmo', async () => {
    expect(await digestHex('SHA-384', 'x', subtle)).toHaveLength(96)
    expect(await digestHex('SHA-512', 'x', subtle)).toHaveLength(128)
  })

  it('HMAC-SHA256 do exemplo clássico', async () => {
    expect(await hmacHex('SHA-256', 'key', 'The quick brown fox jumps over the lazy dog', subtle)).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8')
  })
})
