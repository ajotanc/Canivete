export type GroupStatus = 'open' | 'drawing' | 'drawn'

export interface GroupRow {
  id: string
  name: string
  /** Texto livre; vazio quando não informado. */
  budget: string
  /** AAAA-MM-DD; vazio quando não informado. */
  eventDate: string
  organizerTokenHash: string
  status: GroupStatus
}

export interface ParticipantRow {
  id: string
  groupId: string
  name: string
  nameKey: string
  wishlist: string
  pinHash: string
  failedAttempts: number
  /** ISO com Z, ou null quando não está bloqueado. */
  lockedUntil: string | null
  assignedToId: string | null
  isOrganizer: boolean
}

/** Acesso ao banco. A implementação real usa o Appwrite; os testes usam um banco em memória. */
export interface SantaDb {
  createGroup(group: Omit<GroupRow, 'id'>): Promise<string>
  getGroup(id: string): Promise<GroupRow | null>
  setGroupStatus(id: string, status: GroupStatus): Promise<void>
  createParticipant(participant: Omit<ParticipantRow, 'id'>): Promise<string>
  listParticipants(groupId: string): Promise<ParticipantRow[]>
  updateParticipant(id: string, patch: Partial<Omit<ParticipantRow, 'id'>>): Promise<void>
  deleteParticipant(id: string): Promise<void>
}
