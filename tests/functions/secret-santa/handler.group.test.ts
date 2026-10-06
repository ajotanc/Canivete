import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { hashToken } from '../../../functions/secret-santa/src/lib/tokens'
import { enroll } from './enroll'
import { createFakeDb } from './fakeDb'

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}

async function newGroup(db = createFakeDb(), extra: Record<string, unknown> = {}) {
  const data = (await handleAction(db, { action: 'createGroup', name: 'Família', ...extra })) as {
    groupId: string
    adminToken: string
  }
  return { db, ...data }
}

describe('createGroup', () => {
  it('cria o grupo aberto e devolve o token do organizador, guardando só o hash', async () => {
    const { db, groupId, adminToken } = await newGroup(createFakeDb(), { budget: 'R$ 50', eventDate: '2026-12-24' })
    const group = db.groups.get(groupId)!
    expect(group.status).toBe('open')
    expect(group.budget).toBe('R$ 50')
    expect(group.organizerTokenHash).toBe(hashToken(adminToken))
    expect(JSON.stringify([...db.groups.values()])).not.toContain(adminToken)
  })

  it('cria também o organizador como participante quando ele participa', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), {
      organizer: { name: 'Lia', pin: '4321', wishlist: 'livro' },
    })
    const [organizer] = await db.listParticipants(groupId)
    expect(organizer).toMatchObject({ name: 'Lia', isOrganizer: true, wishlist: 'livro' })
    expect(organizer.pinHash).not.toContain('4321')
  })

  it('rejeita dados inválidos', async () => {
    const db = createFakeDb()
    expect(await errorCode(handleAction(db, { action: 'createGroup', name: '' }))).toBe('INVALID_INPUT')
    expect(
      await errorCode(handleAction(db, { action: 'createGroup', name: 'x', eventDate: '2026-02-30' })),
    ).toBe('INVALID_INPUT')
    expect(
      await errorCode(handleAction(db, { action: 'createGroup', name: 'x', organizer: { name: 'Lia', pin: 'abcd' } })),
    ).toBe('INVALID_INPUT')
    expect(db.groups.size).toBe(0)
  })
})


describe('getGroup', () => {
  it('devolve dados públicos, a contagem e os nomes com quem já criou PIN', async () => {
    const { db, groupId, adminToken } = await newGroup(createFakeDb(), { organizer: { name: 'Lia', pin: '4321' } })
    await handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'Ana' })
    const info = (await handleAction(db, { action: 'getGroup', groupId })) as Record<string, unknown>
    expect(info).toEqual({
      name: 'Família',
      budget: '',
      eventDate: '',
      status: 'open',
      participantCount: 2,
      members: [
        { name: 'Lia', hasPin: true },
        { name: 'Ana', hasPin: false },
      ],
    })
  })

  it('devolve GROUP_NOT_FOUND para id inexistente ou malformado', async () => {
    const db = createFakeDb()
    expect(await errorCode(handleAction(db, { action: 'getGroup', groupId: 'naoexiste' }))).toBe('GROUP_NOT_FOUND')
    expect(await errorCode(handleAction(db, { action: 'getGroup', groupId: '../x' }))).toBe('GROUP_NOT_FOUND')
    expect(await errorCode(handleAction(db, { action: 'getGroup' }))).toBe('GROUP_NOT_FOUND')
  })
})

describe('addParticipant (organizador)', () => {
  it('cadastra a pessoa sem PIN', async () => {
    const { db, groupId, adminToken } = await newGroup()
    await handleAction(db, { action: 'addParticipant', groupId, adminToken, name: ' Ana ' })
    const [ana] = await db.listParticipants(groupId)
    expect(ana).toMatchObject({ name: 'Ana', nameKey: 'ana', isOrganizer: false, failedAttempts: 0, pinHash: null })
  })

  it('exige o token do organizador', async () => {
    const { db, groupId } = await newGroup()
    for (const adminToken of [undefined, '', 'errado']) {
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'Ana' }))).toBe(
        'FORBIDDEN',
      )
    }
    expect((await db.listParticipants(groupId)).length).toBe(0)
  })

  it('recusa nome repetido com acento, caixa ou espaços diferentes', async () => {
    const { db, groupId, adminToken } = await newGroup()
    await handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'João' })
    for (const name of ['joão', '  JOÃO  ', 'João']) {
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, adminToken, name }))).toBe(
        'NAME_TAKEN',
      )
    }
    // Sem acento é outro nome.
    await handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'Joao' })
    expect((await db.listParticipants(groupId)).length).toBe(2)
  })

  it('recusa nome vazio ou longo demais', async () => {
    const { db, groupId, adminToken } = await newGroup()
    for (const name of ['', '   ', 'x'.repeat(61), 42]) {
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, adminToken, name }))).toBe(
        'INVALID_INPUT',
      )
    }
  })

  it('recusa cadastro quando o grupo não está aberto', async () => {
    const { db, groupId, adminToken } = await newGroup()
    for (const status of ['drawing', 'drawn'] as const) {
      await db.setGroupStatus(groupId, status)
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'Ana' }))).toBe(
        'GROUP_CLOSED',
      )
    }
  })

  it('recusa o 101º participante', async () => {
    const { db, groupId, adminToken } = await newGroup()
    for (let i = 0; i < 100; i++) {
      await db.createParticipant({
        groupId, name: `P${i}`, nameKey: `p${i}`, wishlist: '', pinHash: null,
        failedAttempts: 0, lockedUntil: null, assignedToId: null, isOrganizer: false,
      })
    }
    expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'Extra' }))).toBe(
      'INVALID_INPUT',
    )
  })

  it('a ação join não existe mais', async () => {
    const { db, groupId } = await newGroup()
    expect(await errorCode(handleAction(db, { action: 'join', groupId, name: 'Ana', pin: '1234' }))).toBe(
      'INVALID_INPUT',
    )
  })
})

describe('listParticipants e removeParticipant (organizador)', () => {
  it('exige o token do organizador', async () => {
    const { db, groupId } = await newGroup()
    for (const adminToken of [undefined, '', 'errado']) {
      expect(await errorCode(handleAction(db, { action: 'listParticipants', groupId, adminToken }))).toBe('FORBIDDEN')
      expect(
        await errorCode(handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'Ana' })),
      ).toBe('FORBIDDEN')
    }
  })

  it('lista nomes, quem organiza e quem já criou PIN, sem PIN, desejos nem pares', async () => {
    const { db, groupId, adminToken } = await newGroup(createFakeDb(), { organizer: { name: 'Lia', pin: '4321' } })
    await enroll(db, groupId, adminToken, { name: 'Ana', pin: '1234', wishlist: 'segredo' })
    await handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'Bia' })
    const result = (await handleAction(db, { action: 'listParticipants', groupId, adminToken })) as {
      status: string
      participants: Record<string, unknown>[]
    }
    expect(result.status).toBe('open')
    expect(result.participants).toEqual([
      { name: 'Lia', isOrganizer: true, hasPin: true },
      { name: 'Ana', isOrganizer: false, hasPin: true },
      { name: 'Bia', isOrganizer: false, hasPin: false },
    ])
    expect(JSON.stringify(result)).not.toContain('segredo')
    expect(JSON.stringify(result)).not.toContain('scrypt')
  })

  it('remove um participante antes do sorteio (nome com variações) e recusa depois', async () => {
    const { db, groupId, adminToken } = await newGroup()
    await handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'Ana' })
    await handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: ' ANA ' })
    expect((await db.listParticipants(groupId)).length).toBe(0)

    expect(
      await errorCode(handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'Ana' })),
    ).toBe('INVALID_INPUT')

    await db.setGroupStatus(groupId, 'drawn')
    expect(
      await errorCode(handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'Ana' })),
    ).toBe('GROUP_CLOSED')
  })
})

describe('ações desconhecidas', () => {
  it('devolve INVALID_INPUT', async () => {
    expect(await errorCode(handleAction(createFakeDb(), { action: 'nada' }))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(createFakeDb(), null))).toBe('INVALID_INPUT')
  })
})
