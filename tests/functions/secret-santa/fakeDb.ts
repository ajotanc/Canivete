import { SantaError } from '../../../functions/secret-santa/src/lib/errors'
import type { GroupRow, ParticipantRow, SantaDb } from '../../../functions/secret-santa/src/types'

/** Banco em memória que imita o contrato do Appwrite, incluindo a unicidade de (grupo, nome). */
export function createFakeDb() {
  const groups = new Map<string, GroupRow>()
  const participants = new Map<string, ParticipantRow>()
  let counter = 0
  let updatesLeft: number | null = null

  const db: SantaDb & {
    groups: typeof groups
    participants: typeof participants
    failUpdateParticipantAfter(n: number): void
  } = {
    groups,
    participants,
    failUpdateParticipantAfter(n) {
      updatesLeft = n
    },
    async createGroup(group) {
      const id = `g${++counter}`
      groups.set(id, { id, ...group })
      return id
    },
    async getGroup(id) {
      return groups.get(id) ?? null
    },
    async setGroupStatus(id, status) {
      const group = groups.get(id)
      if (group) group.status = status
    },
    async createParticipant(participant) {
      const duplicate = [...participants.values()].some(
        (p) => p.groupId === participant.groupId && p.nameKey === participant.nameKey,
      )
      if (duplicate) {
        throw new SantaError('NAME_TAKEN', 'Já existe alguém com esse nome neste grupo. Use outro nome.')
      }
      const id = `p${++counter}`
      participants.set(id, { id, ...participant })
      return id
    },
    async listParticipants(groupId) {
      return [...participants.values()].filter((p) => p.groupId === groupId)
    },
    async updateParticipant(id, patch) {
      if (updatesLeft !== null) {
        if (updatesLeft === 0) throw new Error('falha simulada')
        updatesLeft -= 1
      }
      const current = participants.get(id)
      if (current) participants.set(id, { ...current, ...patch })
    },
    async deleteParticipant(id) {
      participants.delete(id)
    },
  }
  return db
}
