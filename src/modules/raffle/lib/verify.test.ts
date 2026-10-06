import { describe, expect, it } from 'vitest'
import { canonicalJson, computeHash, sha256Hex, verifyRecord } from './verify'

const record = {
  participants: ['Ana', 'Bruno', 'Carla'],
  winners: ['Bruno'],
  drawnAt: '2026-10-05T12:00:00.000Z',
}

describe('sha256Hex', () => {
  it('bate com o vetor de teste conhecido para "abc"', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})

describe('canonicalJson', () => {
  it('usa sempre a ordem de chaves participants, winners, drawnAt', () => {
    const shuffled = { drawnAt: record.drawnAt, winners: record.winners, participants: record.participants }
    expect(canonicalJson(shuffled)).toBe(canonicalJson(record))
    expect(canonicalJson(record)).toBe(
      '{"participants":["Ana","Bruno","Carla"],"winners":["Bruno"],"drawnAt":"2026-10-05T12:00:00.000Z"}',
    )
  })
})

describe('computeHash', () => {
  it('tem 64 caracteres hexadecimais e é estável', async () => {
    const hash = await computeHash(record)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(await computeHash(record)).toBe(hash)
  })

  it('muda quando qualquer campo muda', async () => {
    const original = await computeHash(record)
    expect(await computeHash({ ...record, winners: ['Ana'] })).not.toBe(original)
    expect(await computeHash({ ...record, participants: ['Ana', 'Bruno'] })).not.toBe(original)
    expect(await computeHash({ ...record, drawnAt: '2026-10-05T12:00:01.000Z' })).not.toBe(original)
  })

  it('é estável com aspas, barras invertidas, emoji e acentos', async () => {
    const tricky = {
      participants: ['Zoë "Z" \ Silva', '🎉 Festa', 'João'],
      winners: ['🎉 Festa'],
      drawnAt: record.drawnAt,
    }
    const hash = await computeHash(tricky)
    // Simula gravar e ler: serializar e desserializar o JSON não pode alterar o hash.
    const roundTripped = JSON.parse(JSON.stringify(tricky))
    expect(await computeHash(roundTripped)).toBe(hash)
  })
})

describe('verifyRecord', () => {
  it('confirma um registro íntegro', async () => {
    expect(await verifyRecord({ ...record, hash: await computeHash(record) })).toBe(true)
  })

  it('detecta adulteração dos vencedores', async () => {
    const hash = await computeHash(record)
    expect(await verifyRecord({ ...record, winners: ['Ana'], hash })).toBe(false)
  })
})
