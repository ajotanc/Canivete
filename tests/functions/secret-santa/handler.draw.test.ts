import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { enroll } from './enroll'
import { createFakeDb } from './fakeDb'

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
  const { groupId, adminToken } = (await handleAction(db, {
    action: 'createGroup',
    name: 'Turma',
    ...(organizerName ? { organizer: { name: organizerName, pin: '9999' } } : {}),
  })) as { groupId: string; adminToken: string }
  for (const [i, name] of names.entries()) {
    await enroll(db, groupId, adminToken, { name, pin: `${1000 + i}` })
  }
  return { db, groupId, adminToken }
}

describe('draw', () => {
  it('exige o token do organizador', async () => {
    const { db, groupId } = await groupWith(['A', 'B', 'C'])
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken: 'errado' }))).toBe('FORBIDDEN')
    expect(db.groups.get(groupId)!.status).toBe('open')
  })

  it('exige 3 ou mais participantes, também depois de remoções', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'removeParticipant', groupId, adminToken, name: 'C' })
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))).toBe('NOT_ENOUGH_PARTICIPANTS')
    expect(db.groups.get(groupId)!.status).toBe('open')
  })

  it('com exatamente 3 pessoas, sorteia sem ninguém tirar a si mesmo e fecha o grupo', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'draw', groupId, adminToken })
    expect(db.groups.get(groupId)!.status).toBe('drawn')
    const rows = await db.listParticipants(groupId)
    for (const row of rows) {
      expect(row.assignedToId).not.toBeNull()
      expect(row.assignedToId).not.toBe(row.id)
    }
    expect(new Set(rows.map((r) => r.assignedToId)).size).toBe(3)
  })

  it('cada pessoa vê só o próprio par, e o organizador que participa também', async () => {
    const { db, groupId, adminToken } = await groupWith(['Ana', 'Bia'], 'Lia')
    await handleAction(db, { action: 'draw', groupId, adminToken })
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
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    await handleAction(db, { action: 'draw', groupId, adminToken })
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))).toBe('GROUP_CLOSED')
    expect(await errorCode(handleAction(db, { action: 'addParticipant', groupId, adminToken, name: 'D' }))).toBe(
      'GROUP_CLOSED',
    )
  })

  it('se falhar no meio da gravação, volta para open e permite tentar de novo', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    db.failUpdateParticipantAfter(1)
    expect(await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))).toBe('INTERNAL')
    expect(db.groups.get(groupId)!.status).toBe('open')

    db.failUpdateParticipantAfter(1000)
    await handleAction(db, { action: 'draw', groupId, adminToken })
    expect(db.groups.get(groupId)!.status).toBe('drawn')
    const rows = await db.listParticipants(groupId)
    expect(rows.every((r) => r.assignedToId !== null && r.assignedToId !== r.id)).toBe(true)
  })

  it('uma tentativa que falhou não deixa pares incompletos visíveis em reveal', async () => {
    const { db, groupId, adminToken } = await groupWith(['A', 'B', 'C'])
    db.failUpdateParticipantAfter(1)
    await errorCode(handleAction(db, { action: 'draw', groupId, adminToken }))
    const result = await handleAction(db, { action: 'reveal', groupId, name: 'A', pin: '1000' })
    expect(result).toEqual({ status: 'open', wishlist: '' })
  })
})
