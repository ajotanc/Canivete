import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { enroll } from './enroll'
import { createFakeDb } from './fakeDb'
import { OWNER, STRANGER } from './owner'

async function errorOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return error as { code?: string; message: string }
  }
  return undefined
}

async function setup() {
  const db = createFakeDb()
  const { groupId } = (await handleAction(db, { action: 'createGroup', name: 'Família' }, OWNER)) as {
    groupId: string
  }
  await handleAction(db, { action: 'addParticipant', groupId, name: 'João' }, OWNER)
  return { db, groupId }
}

describe('setupPin (primeiro acesso)', () => {
  it('cria o PIN em hash e grava a lista de desejos', async () => {
    const { db, groupId } = await setup()
    await handleAction(db, { action: 'setupPin', groupId, name: ' joão ', pin: '1234', wishlist: 'livro' })
    const [joao] = await db.listParticipants(groupId)
    expect(joao.pinHash).toMatch(/^scrypt\$/)
    expect(joao.wishlist).toEqual(['livro'])
    expect(await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })).toEqual({
      status: 'open',
      wishlist: [{ text: 'livro' }],
    })
  })

  it('recusa criar de novo quando a pessoa já tem PIN', async () => {
    const { db, groupId } = await setup()
    await handleAction(db, { action: 'setupPin', groupId, name: 'João', pin: '1234' })
    const error = await errorOf(handleAction(db, { action: 'setupPin', groupId, name: 'João', pin: '9999' }))
    expect(error?.code).toBe('PIN_ALREADY_SET')
    // O PIN original continua valendo.
    expect(await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })).toMatchObject({
      status: 'open',
    })
  })

  it('recusa nome fora da lista e PIN inválido', async () => {
    const { db, groupId } = await setup()
    expect((await errorOf(handleAction(db, { action: 'setupPin', groupId, name: 'Ninguém', pin: '1234' })))?.code).toBe(
      'INVALID_INPUT',
    )
    for (const pin of ['12', '12a4', 1234, undefined]) {
      expect((await errorOf(handleAction(db, { action: 'setupPin', groupId, name: 'João', pin })))?.code).toBe(
        'INVALID_INPUT',
      )
    }
    expect((await db.listParticipants(groupId))[0].pinHash).toBeNull()
  })

  it('funciona depois do sorteio, sem mudar a lista de desejos', async () => {
    const { db, groupId } = await setup()
    await enroll(db, groupId, { name: 'Ana', pin: '1111', wishlist: 'chocolate' })
    await enroll(db, groupId, { name: 'Bia', pin: '2222' })
    await handleAction(db, { action: 'draw', groupId }, OWNER)

    await handleAction(db, { action: 'setupPin', groupId, name: 'João', pin: '1234', wishlist: 'tarde demais' })
    const result = (await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })) as {
      status: string
      wishlist: unknown[]
      receiver: { name: string }
    }
    expect(result.status).toBe('drawn')
    expect(result.wishlist).toEqual([])
    expect(['Ana', 'Bia']).toContain(result.receiver.name)
  })

  it('se outra gravação ganhar a corrida, responde PIN_ALREADY_SET', async () => {
    const { db, groupId } = await setup()
    const original = db.updateParticipant.bind(db)
    // Simula outra pessoa gravando um PIN logo depois desta gravação.
    db.updateParticipant = async (id, patch) => {
      await original(id, patch)
      if (patch.pinHash) await original(id, { pinHash: 'scrypt$outro$hash' })
    }
    const error = await errorOf(handleAction(db, { action: 'setupPin', groupId, name: 'João', pin: '1234' }))
    expect(error?.code).toBe('PIN_ALREADY_SET')
  })
})

describe('entrar antes do primeiro acesso', () => {
  it('reveal e updateWishlist respondem PIN_NOT_SET', async () => {
    const { db, groupId } = await setup()
    for (const action of ['reveal', 'updateWishlist']) {
      const error = await errorOf(handleAction(db, { action, groupId, name: 'João', pin: '1234', wishlist: 'x' }))
      expect(error?.code).toBe('PIN_NOT_SET')
      expect(error?.message).toMatch(/primeiro acesso/)
    }
  })
})

describe('resetPin (organizador)', () => {
  it('zera o PIN, as tentativas e o bloqueio; a pessoa cria um novo', async () => {
    const { db, groupId } = await setup()
    await handleAction(db, { action: 'setupPin', groupId, name: 'João', pin: '1234' })
    for (let i = 0; i < 5; i++) await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '0000' }))
    expect((await db.listParticipants(groupId))[0].lockedUntil).not.toBeNull()

    await handleAction(db, { action: 'resetPin', groupId, name: 'JOÃO' }, OWNER)
    const [joao] = await db.listParticipants(groupId)
    expect(joao).toMatchObject({ pinHash: null, failedAttempts: 0, lockedUntil: null })

    await handleAction(db, { action: 'setupPin', groupId, name: 'João', pin: '5678' })
    expect(await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '5678' })).toMatchObject({
      status: 'open',
    })
  })

  it('funciona depois do sorteio e mantém o par', async () => {
    const { db, groupId } = await setup()
    await enroll(db, groupId, { name: 'Ana', pin: '1111' })
    await enroll(db, groupId, { name: 'Bia', pin: '2222' })
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    const before = (await db.listParticipants(groupId)).find((p) => p.name === 'Ana')!.assignedToId

    await handleAction(db, { action: 'resetPin', groupId, name: 'Ana' }, OWNER)
    const after = (await db.listParticipants(groupId)).find((p) => p.name === 'Ana')!
    expect(after.pinHash).toBeNull()
    expect(after.assignedToId).toBe(before)
  })

  it('exige a conta do organizador e um nome da lista', async () => {
    const { db, groupId } = await setup()
    for (const caller of [undefined, STRANGER]) {
      expect(
        (await errorOf(handleAction(db, { action: 'resetPin', groupId, name: 'João' }, caller)))?.code,
      ).toBe('FORBIDDEN')
    }
    expect(
      (await errorOf(handleAction(db, { action: 'resetPin', groupId, name: 'Ninguém' }, OWNER)))?.code,
    ).toBe('INVALID_INPUT')
  })
})
