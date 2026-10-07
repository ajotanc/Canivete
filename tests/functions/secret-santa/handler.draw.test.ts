import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { enroll } from './enroll'
import { createFakeDb } from './fakeDb'
import { OWNER, STRANGER } from './owner'

async function errorCode(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}

async function groupWith(names: string[], organizerName?: string) {
  const db = createFakeDb()
  const { groupId } = (await handleAction(db, {
    action: 'createGroup',
    name: 'Turma',
    ...(organizerName ? { organizer: { name: organizerName, pin: '9999' } } : {}),
  }, OWNER)) as { groupId: string }
  for (const [i, name] of names.entries()) {
    await enroll(db, groupId, { name, pin: `${1000 + i}` })
  }
  return { db, groupId }
}

describe('draw', () => {
  it('exige a conta do organizador', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    expect(await errorCode(handleAction(db, { action: 'draw', groupId }, STRANGER))).toBe('FORBIDDEN')
    expect(db.groups.get(groupId)!.status).toBe('open')
  })

  it('exige 3 ou mais participantes, também depois de remoções', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'removeParticipant', groupId, name: 'C' }, OWNER)
    expect(await errorCode(handleAction(db, { action: 'draw', groupId }, OWNER))).toBe('NOT_ENOUGH_PARTICIPANTS')
    expect(db.groups.get(groupId)!.status).toBe('open')
  })

  it('com exatamente 3 pessoas, sorteia sem ninguém tirar a si mesmo e fecha o grupo', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    expect(db.groups.get(groupId)!.status).toBe('drawn')
    const rows = await db.listParticipants(groupId)
    for (const row of rows) {
      expect(row.assignedToId).not.toBeNull()
      expect(row.assignedToId).not.toBe(row.id)
    }
    expect(new Set(rows.map((r) => r.assignedToId)).size).toBe(3)
  })

  it('cada pessoa vê só o próprio par, e o organizador que participa também', async () => {
    const { db, groupId } = await groupWith(['Ana', 'Bia'], 'Lia')
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    const names = ['Ana', 'Bia', 'Lia']
    const pins: Record<string, string> = { Ana: '1000', Bia: '1001', Lia: '9999' }
    const received: string[] = []
    for (const name of names) {
      const result = (await handleAction(db, { action: 'reveal', groupId, name, pin: pins[name] })) as {
        status: string
        receiver: { name: string }
      }
      expect(result.status).toBe('drawn')
      expect(result.receiver.name).not.toBe(name)
      expect(Object.keys(result).sort()).toEqual(['receiver', 'status', 'wishlist'])
      received.push(result.receiver.name)
    }
    expect(new Set(received).size).toBe(3)
  })

  it('não pode ser feito duas vezes nem aceitar entradas depois', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    expect(await errorCode(handleAction(db, { action: 'draw', groupId }, OWNER))).toBe('GROUP_CLOSED')
    expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, name: 'D' }, OWNER))).toBe(
      'GROUP_CLOSED',
    )
  })

  it('se falhar no meio da gravação, volta para open e permite tentar de novo', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    db.failUpdateParticipantAfter(1)
    expect(await errorCode(handleAction(db, { action: 'draw', groupId }, OWNER))).toBe('INTERNAL')
    expect(db.groups.get(groupId)!.status).toBe('open')

    db.failUpdateParticipantAfter(1000)
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    expect(db.groups.get(groupId)!.status).toBe('drawn')
    const rows = await db.listParticipants(groupId)
    expect(rows.every((r) => r.assignedToId !== null && r.assignedToId !== r.id)).toBe(true)
  })

  it('uma tentativa que falhou não deixa pares incompletos visíveis em reveal', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    db.failUpdateParticipantAfter(1)
    await errorCode(handleAction(db, { action: 'draw', groupId }, OWNER))
    const result = await handleAction(db, { action: 'reveal', groupId, name: 'A', pin: '1000' })
    expect(result).toEqual({ status: 'open', wishlist: [] })
  })
})

describe('exclusões', () => {
  it('guarda os pares, devolve para o organizador e ninguém tira o par proibido', async () => {
    const { db, groupId } = await groupWith(['Ana', 'Bia', 'Caio', 'Duda'])
    await handleAction(db, { action: 'setExclusions', groupId, exclusions: [['Ana', 'Bia'], ['bia', 'ANA']] }, OWNER)
    const listed = (await handleAction(db, { action: 'listParticipants', groupId }, OWNER)) as { exclusions: string[][] }
    expect(listed.exclusions).toHaveLength(1)

    for (let i = 0; i < 20; i++) {
      await handleAction(db, { action: 'draw', groupId }, OWNER)
      const byName = new Map([...db.participants.values()].map((p) => [p.id, p.name]))
      const given = new Map([...db.participants.values()].map((p) => [p.name, byName.get(p.assignedToId!)]))
      expect(given.get('Ana')).not.toBe('Bia')
      expect(given.get('Bia')).not.toBe('Ana')
      db.groups.get(groupId)!.status = 'open'
    }
  })

  it('recusa nomes de fora, o mesmo nome duas vezes e quem não é o dono', async () => {
    const { db, groupId } = await groupWith(['Ana', 'Bia', 'Caio'])
    expect(await errorCode(handleAction(db, { action: 'setExclusions', groupId, exclusions: [['Ana', 'Zé']] }, OWNER))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(db, { action: 'setExclusions', groupId, exclusions: [['Ana', 'Ana']] }, OWNER))).toBe('INVALID_INPUT')
    expect(await errorCode(handleAction(db, { action: 'setExclusions', groupId, exclusions: [] }, STRANGER))).toBe('FORBIDDEN')
  })

  it('avisa quando as regras tornam o sorteio impossível e some o par de quem foi removido', async () => {
    const { db, groupId } = await groupWith(['Ana', 'Bia', 'Caio'])
    await handleAction(db, { action: 'setExclusions', groupId, exclusions: [['Ana', 'Bia'], ['Ana', 'Caio'], ['Bia', 'Caio']] }, OWNER)
    expect(await errorCode(handleAction(db, { action: 'draw', groupId }, OWNER))).toBe('DRAW_IMPOSSIBLE')
    expect(db.groups.get(groupId)!.status).toBe('open')
    await handleAction(db, { action: 'removeParticipant', groupId, name: 'Caio' }, OWNER)
    expect(db.groups.get(groupId)!.exclusions).toHaveLength(1)
  })
})

describe('refazer o sorteio', () => {
  it('reabre o grupo, apaga os pares e as perguntas quando ninguém abriu a carta', async () => {
    const { db, groupId } = await groupWith(['Ana', 'Bia', 'Caio'])
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    await handleAction(db, { action: 'askQuestion', groupId, name: 'Ana', pin: '1000', question: 'Gosta de quê?' })
    expect(db.questions.size).toBe(1)

    expect(await errorCode(handleAction(db, { action: 'resetDraw', groupId }, STRANGER))).toBe('FORBIDDEN')
    await handleAction(db, { action: 'resetDraw', groupId }, OWNER)
    expect(db.groups.get(groupId)!.status).toBe('open')
    expect([...db.participants.values()].every((p) => p.assignedToId === null)).toBe(true)
    expect(db.questions.size).toBe(0)
    // Dá para sortear de novo.
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    expect(db.groups.get(groupId)!.status).toBe('drawn')
  })

  it('recusa depois que alguém abriu a carta, e antes do sorteio', async () => {
    const { db, groupId } = await groupWith(['Ana', 'Bia', 'Caio'])
    expect(await errorCode(handleAction(db, { action: 'resetDraw', groupId }, OWNER))).toBe('INVALID_INPUT')
    await handleAction(db, { action: 'draw', groupId }, OWNER)
    await handleAction(db, { action: 'markRevealed', groupId, name: 'Bia', pin: '1001' })
    const listed = (await handleAction(db, { action: 'listParticipants', groupId }, OWNER)) as { anyRevealed: boolean }
    expect(listed.anyRevealed).toBe(true)
    expect(await errorCode(handleAction(db, { action: 'resetDraw', groupId }, OWNER))).toBe('GROUP_CLOSED')
    expect(db.groups.get(groupId)!.status).toBe('drawn')
  })
})
