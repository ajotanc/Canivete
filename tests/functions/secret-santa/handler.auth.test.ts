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
  await enroll(db, groupId, { name: 'João', pin: '1234', wishlist: 'livro' })
  return { db, groupId }
}

describe('reveal antes do sorteio', () => {
  it('devolve status open e a própria lista de desejos', async () => {
    const { db, groupId } = await setup()
    expect(await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })).toEqual({
      status: 'open',
      wishlist: [{ text: 'livro' }],
    })
  })

  it('aceita variações de caixa, acento igual e espaços no nome', async () => {
    const { db, groupId } = await setup()
    for (const name of ['joão', '  JOÃO ', 'João']) {
      expect(await handleAction(db, { action: 'reveal', groupId, name, pin: '1234' })).toMatchObject({ status: 'open' })
    }
  })
})

describe('credenciais inválidas', () => {
  it('PIN errado e nome inexistente respondem exatamente igual', async () => {
    const { db, groupId } = await setup()
    const wrongPin = await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '9999' }))
    const noName = await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'Ninguém', pin: '9999' }))
    expect(wrongPin?.code).toBe('BAD_CREDENTIALS')
    expect(noName?.code).toBe('BAD_CREDENTIALS')
    expect(wrongPin?.message).toBe(noName?.message)
  })

  it('PIN com formato inválido é recusado antes de consultar o grupo', async () => {
    const { db, groupId } = await setup()
    for (const pin of ['12', '12a4', 1234, undefined]) {
      expect((await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin })))?.code).toBe(
        'INVALID_INPUT',
      )
    }
  })

  it('grupo inexistente devolve GROUP_NOT_FOUND', async () => {
    const { db } = await setup()
    expect(
      (await errorOf(handleAction(db, { action: 'reveal', groupId: 'naoexiste', name: 'João', pin: '1234' })))?.code,
    ).toBe('GROUP_NOT_FOUND')
  })
})

describe('bloqueio por tentativas', () => {
  it('bloqueia no 5º erro, mesmo com o PIN certo, até o prazo de 15 minutos passar', async () => {
    const { db, groupId } = await setup()
    let now = new Date('2026-10-06T12:00:00.000Z')
    const deps = { now: () => now }
    const wrong = { action: 'reveal', groupId, name: 'João', pin: '0000' }

    for (let i = 0; i < 4; i++) {
      expect((await errorOf(handleAction(db, wrong, deps)))?.code).toBe('BAD_CREDENTIALS')
    }
    expect((await errorOf(handleAction(db, wrong, deps)))?.code).toBe('LOCKED')

    // Com o PIN certo, ainda bloqueado.
    const right = { action: 'reveal', groupId, name: 'João', pin: '1234' }
    const locked = await errorOf(handleAction(db, right, deps))
    expect(locked?.code).toBe('LOCKED')
    expect(locked?.message).toMatch(/15 minutos/)

    // 14 minutos depois, ainda bloqueado; 16 minutos depois, libera e zera o contador.
    now = new Date('2026-10-06T12:14:00.000Z')
    expect((await errorOf(handleAction(db, right, deps)))?.code).toBe('LOCKED')
    now = new Date('2026-10-06T12:16:00.000Z')
    expect(await handleAction(db, right, deps)).toMatchObject({ status: 'open' })
    const [joao] = await db.listParticipants(groupId)
    expect(joao.failedAttempts).toBe(0)
    expect(joao.lockedUntil).toBeNull()
  })

  it('um acerto zera as tentativas erradas anteriores', async () => {
    const { db, groupId } = await setup()
    await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '0000' }))
    await errorOf(handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '0000' }))
    await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })
    expect((await db.listParticipants(groupId))[0].failedAttempts).toBe(0)
  })
})

describe('updateWishlist', () => {
  it('atualiza a lista com nome e PIN certos', async () => {
    const { db, groupId } = await setup()
    await handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '1234', wishlist: ' meias \nchá' })
    expect((await db.listParticipants(groupId))[0].wishlist).toEqual(['meias', 'chá'])
  })

  it('recusa PIN errado, e depois do sorteio ainda deixa editar', async () => {
    const { db, groupId } = await setup()
    expect(
      (await errorOf(handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '9999', wishlist: 'x' })))
        ?.code,
    ).toBe('BAD_CREDENTIALS')
    await db.setGroupStatus(groupId, 'drawn')
    await handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '1234', wishlist: 'x' })
    expect((await db.listParticipants(groupId))[0].wishlist).toEqual(['x'])
    await db.setGroupStatus(groupId, 'drawing')
    expect(
      (await errorOf(handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '1234', wishlist: 'y' })))
        ?.code,
    ).toBe('GROUP_CLOSED')
  })

  it('recusa lista longa demais', async () => {
    const { db, groupId } = await setup()
    expect(
      (await errorOf(
        handleAction(db, { action: 'updateWishlist', groupId, name: 'João', pin: '1234', wishlist: 'x'.repeat(101) }),
      ))?.code,
    ).toBe('INVALID_INPUT')
  })
})

describe('reveal depois do sorteio', () => {
  it('devolve só o par de quem pergunta e a lista dele', async () => {
    const { db, groupId } = await setup()
    await enroll(db, groupId, { name: 'Ana', pin: '1111', wishlist: 'chocolate' })
    await enroll(db, groupId, { name: 'Bia', pin: '2222', wishlist: 'caneca' })
    const [joao, ana, bia] = await db.listParticipants(groupId)
    // Roda: João -> Ana -> Bia -> João
    await db.updateParticipant(joao.id, { assignedToId: ana.id })
    await db.updateParticipant(ana.id, { assignedToId: bia.id })
    await db.updateParticipant(bia.id, { assignedToId: joao.id })
    await db.setGroupStatus(groupId, 'drawn')

    const result = await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })
    expect(result).toEqual({
      status: 'drawn',
      wishlist: [{ text: 'livro' }],
      receiver: { name: 'Ana', wishlist: [{ text: 'chocolate' }] },
    })
    const text = JSON.stringify(result)
    expect(text).not.toContain('Bia')
    expect(text).not.toContain('caneca')
  })

  it('durante o sorteio (drawing) ainda responde como open, sem revelar nada', async () => {
    const { db, groupId } = await setup()
    await db.setGroupStatus(groupId, 'drawing')
    expect(await handleAction(db, { action: 'reveal', groupId, name: 'João', pin: '1234' })).toEqual({
      status: 'open',
      wishlist: [{ text: 'livro' }],
    })
  })
})
