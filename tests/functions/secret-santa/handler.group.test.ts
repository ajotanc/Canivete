import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { enroll } from './enroll'
import { createFakeDb } from './fakeDb'
import { OWNER, STRANGER } from './owner'

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}

async function newGroup(db = createFakeDb(), extra: Record<string, unknown> = {}) {
  const data = (await handleAction(db, { action: 'createGroup', name: 'Família', ...extra }, OWNER)) as {
    groupId: string
  }
  return { db, ...data }
}

describe('createGroup', () => {
  it('guarda o texto do link normalizado, ou null quando vazio', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), { slug: 'Família Silva!' })
    expect(db.groups.get(groupId)!.slug).toBe('familia-silva')
    const other = await newGroup(createFakeDb(), { slug: '  ' })
    expect(other.db.groups.get(other.groupId)!.slug).toBeNull()
    expect(await errorCode(handleAction(createFakeDb(), { action: 'createGroup', name: 'X', slug: 'ab' }, OWNER))).toBe(
      'INVALID_INPUT',
    )
  })

  it('usa um código curto como id e sorteia outro se já existir', async () => {
    const db = createFakeDb()
    const first = (await handleAction(db, { action: 'createGroup', name: 'A' }, OWNER)) as { groupId: string }
    expect(first.groupId).toMatch(/^[a-z2-9]{6}$/)
    // Fonte que repete o primeiro código na primeira tentativa e depois varia.
    const code = [...first.groupId].map((c) => 'abcdefghjkmnpqrstuvwxyz23456789'.indexOf(c))
    let calls = 0
    const randomInt = () => (calls < 6 ? code[calls++] : 7)
    const second = (await handleAction(db, { action: 'createGroup', name: 'B' }, { ...OWNER, randomInt })) as {
      groupId: string
    }
    expect(second.groupId).not.toBe(first.groupId)
    expect(db.groups.size).toBe(2)
  })

  it('exige uma conta logada', async () => {
    expect(await errorCode(handleAction(createFakeDb(), { action: 'createGroup', name: 'Turma' }))).toBe('FORBIDDEN')
  })

  it('cria o grupo aberto, em nome da conta logada', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), { budget: 50, eventDate: '2026-12-24' })
    const group = db.groups.get(groupId)!
    expect(group.status).toBe('open')
    expect(group.budget).toBe(50)
    expect(group.ownerId).toBe(OWNER.userId)
  })

  it('cria também o organizador como participante quando ele participa', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), {
      organizer: { name: 'Lia', pin: '4321', wishlist: 'livro' },
    })
    const [organizer] = await db.listParticipants(groupId)
    expect(organizer).toMatchObject({ name: 'Lia', isOrganizer: true, wishlist: ['livro'] })
    expect(organizer.pinHash).not.toContain('4321')
  })

  it('rejeita dados inválidos', async () => {
    const db = createFakeDb()
    expect(await errorCode(handleAction(db, { action: 'createGroup', name: '' }, OWNER))).toBe('INVALID_INPUT')
    expect(
      await errorCode(handleAction(db, { action: 'createGroup', name: 'x', eventDate: '2026-02-30' }, OWNER)),
    ).toBe('INVALID_INPUT')
    expect(
      await errorCode(handleAction(db, { action: 'createGroup', name: 'x', organizer: { name: 'Lia', pin: 'abcd' } }, OWNER)),
    ).toBe('INVALID_INPUT')
    expect(db.groups.size).toBe(0)
  })
})


describe('getGroup', () => {
  it('devolve dados públicos, a contagem e os nomes com quem já criou PIN', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), { organizer: { name: 'Lia', pin: '4321' } })
    await handleAction(db, { action: 'addParticipant', groupId, name: 'Ana' }, OWNER)
    const info = (await handleAction(db, { action: 'getGroup', groupId })) as Record<string, unknown>
    expect(info).toEqual({
      id: groupId,
      slug: null,
      name: 'Família',
      budget: null,
      eventDate: '',
      status: 'open',
      color: 'berry',
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
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'addParticipant', groupId, name: ' Ana ' }, OWNER)
    const [ana] = await db.listParticipants(groupId)
    expect(ana).toMatchObject({ name: 'Ana', nameKey: 'ana', isOrganizer: false, failedAttempts: 0, pinHash: null })
  })

  it('exige a conta do organizador', async () => {
    const { db, groupId } = await newGroup()
    for (const caller of [undefined, { userId: null }, STRANGER]) {
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, name: 'Ana' }, caller))).toBe(
        'FORBIDDEN',
      )
    }
    expect((await db.listParticipants(groupId)).length).toBe(0)
  })

  it('recusa nome repetido com acento, caixa ou espaços diferentes', async () => {
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'addParticipant', groupId, name: 'João' }, OWNER)
    for (const name of ['joão', '  JOÃO  ', 'João']) {
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, name }, OWNER))).toBe(
        'NAME_TAKEN',
      )
    }
    // Sem acento é outro nome.
    await handleAction(db, { action: 'addParticipant', groupId, name: 'Joao' }, OWNER)
    expect((await db.listParticipants(groupId)).length).toBe(2)
  })

  it('recusa nome vazio ou longo demais', async () => {
    const { db, groupId } = await newGroup()
    for (const name of ['', '   ', 'x'.repeat(61), 42]) {
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, name }, OWNER))).toBe(
        'INVALID_INPUT',
      )
    }
  })

  it('recusa cadastro quando o grupo não está aberto', async () => {
    const { db, groupId } = await newGroup()
    for (const status of ['drawing', 'drawn'] as const) {
      await db.setGroupStatus(groupId, status)
      expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, name: 'Ana' }, OWNER))).toBe(
        'GROUP_CLOSED',
      )
    }
  })

  it('recusa o 101º participante', async () => {
    const { db, groupId } = await newGroup()
    for (let i = 0; i < 100; i++) {
      await db.createParticipant({
        groupId, name: `P${i}`, nameKey: `p${i}`, wishlist: null, pinHash: null,
        failedAttempts: 0, lockedUntil: null, assignedToId: null, isOrganizer: false, revealed: false,
      })
    }
    expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, name: 'Extra' }, OWNER))).toBe(
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
  it('exige a conta do organizador', async () => {
    const { db, groupId } = await newGroup()
    for (const caller of [undefined, { userId: null }, STRANGER]) {
      expect(await errorCode(handleAction(db, { action: 'listParticipants', groupId }, caller))).toBe('FORBIDDEN')
      expect(
        await errorCode(handleAction(db, { action: 'removeParticipant', groupId, name: 'Ana' }, caller)),
      ).toBe('FORBIDDEN')
    }
  })

  it('lista nomes, quem organiza e quem já criou PIN, sem PIN, desejos nem pares', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), { organizer: { name: 'Lia', pin: '4321' } })
    await enroll(db, groupId, { name: 'Ana', pin: '1234', wishlist: 'segredo' })
    await handleAction(db, { action: 'addParticipant', groupId, name: 'Bia' }, OWNER)
    const result = (await handleAction(db, { action: 'listParticipants', groupId }, OWNER)) as {
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
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'addParticipant', groupId, name: 'Ana' }, OWNER)
    await handleAction(db, { action: 'removeParticipant', groupId, name: ' ANA ' }, OWNER)
    expect((await db.listParticipants(groupId)).length).toBe(0)

    expect(
      await errorCode(handleAction(db, { action: 'removeParticipant', groupId, name: 'Ana' }, OWNER)),
    ).toBe('INVALID_INPUT')

    await db.setGroupStatus(groupId, 'drawn')
    expect(
      await errorCode(handleAction(db, { action: 'removeParticipant', groupId, name: 'Ana' }, OWNER)),
    ).toBe('GROUP_CLOSED')
  })
})

describe('ações desconhecidas', () => {
  it('devolve INVALID_INPUT', async () => {
    expect(await errorCode(handleAction(createFakeDb(), { action: 'nada' }))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(createFakeDb(), null))).toBe('INVALID_INPUT')
  })
})

describe('cor do grupo', () => {
  it('começa framboesa, o organizador troca e só aceita cores da lista', async () => {
    const db = createFakeDb()
    const { groupId } = (await handleAction(db, { action: 'createGroup', name: 'Turma' }, OWNER)) as { groupId: string }
    expect(await handleAction(db, { action: 'getGroup', groupId })).toMatchObject({ color: 'berry' })
    expect(await handleAction(db, { action: 'setColor', groupId, color: 'pine' }, OWNER)).toEqual({ color: 'pine' })
    expect(await handleAction(db, { action: 'getGroup', groupId })).toMatchObject({ color: 'pine' })
    expect(await handleAction(db, { action: 'setColor', groupId, color: '#0F766E' }, OWNER)).toEqual({ color: '#0f766e' })
    expect(await errorCode(handleAction(db, { action: 'setColor', groupId, color: '#ffffcc' }, OWNER))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(db, { action: 'setColor', groupId, color: '#000000' }, OWNER))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(db, { action: 'setColor', groupId, color: 'red' }, OWNER))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(db, { action: 'setColor', groupId, color: 'cobalt' }, STRANGER))).toBe('FORBIDDEN')
  })
})
