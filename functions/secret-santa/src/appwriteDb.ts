import dayjs from 'dayjs'
import { Client, ID, Query, TablesDB } from 'node-appwrite'
import { SantaError } from './lib/errors.js'
import type { GroupRow, GroupStatus, ParticipantRow, SantaDb } from './types.js'

type Env = Record<string, string | undefined>

/** Lê a configuração: variáveis da Function com fallback para as que a Appwrite injeta. */
function readConfig(env: Env) {
  const endpoint = env.APPWRITE_ENDPOINT || env.APPWRITE_FUNCTION_API_ENDPOINT
  const projectId = env.APPWRITE_PROJECT_ID || env.APPWRITE_FUNCTION_PROJECT_ID
  const apiKey = env.APPWRITE_API_KEY
  const databaseId = env.SANTA_DATABASE_ID
  if (!endpoint || !projectId || !apiKey || !databaseId) {
    throw new Error('Faltam variáveis: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, SANTA_DATABASE_ID.')
  }
  return {
    endpoint,
    projectId,
    apiKey,
    databaseId,
    groupsTableId: env.SANTA_GROUPS_TABLE_ID || 'santa_groups',
    participantsTableId: env.SANTA_PARTICIPANTS_TABLE_ID || 'santa_participants',
  }
}

/** Banco real, sobre o Appwrite TablesDB com chave de servidor. */
export function createAppwriteDb(env: Env): SantaDb {
  const config = readConfig(env)
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey)
  const tables = new TablesDB(client)
  const { databaseId, groupsTableId, participantsTableId } = config

  const toGroup = (row: Record<string, any>): GroupRow => ({
    id: row.$id,
    name: row.name,
    budget: row.budget ?? '',
    eventDate: row.eventDate ?? '',
    organizerTokenHash: row.organizerTokenHash,
    status: row.status as GroupStatus,
  })

  const toParticipant = (row: Record<string, any>): ParticipantRow => ({
    id: row.$id,
    groupId: row.groupId,
    name: row.name,
    nameKey: row.nameKey,
    wishlist: row.wishlist ?? '',
    pinHash: row.pinHash ?? null,
    failedAttempts: row.failedAttempts ?? 0,
    // O Appwrite devolve "+00:00"; normaliza para ISO com Z.
    lockedUntil: row.lockedUntil ? dayjs(row.lockedUntil).toISOString() : null,
    assignedToId: row.assignedToId ?? null,
    isOrganizer: Boolean(row.isOrganizer),
  })

  return {
    async createGroup(group) {
      const row = await tables.createRow({
        databaseId,
        tableId: groupsTableId,
        rowId: ID.unique(),
        data: { ...group, createdAt: dayjs().toISOString() },
      })
      return row.$id
    },
    async getGroup(id) {
      try {
        return toGroup(await tables.getRow({ databaseId, tableId: groupsTableId, rowId: id }))
      } catch (error) {
        if ((error as { code?: number }).code === 404) return null
        throw error
      }
    },
    async setGroupStatus(id, status) {
      await tables.updateRow({ databaseId, tableId: groupsTableId, rowId: id, data: { status } })
    },
    async createParticipant(participant) {
      try {
        const row = await tables.createRow({
          databaseId,
          tableId: participantsTableId,
          rowId: ID.unique(),
          data: participant,
        })
        return row.$id
      } catch (error) {
        // O índice único (groupId, nameKey) responde 409 quando duas entradas disputam o mesmo nome.
        if ((error as { code?: number }).code === 409) {
          throw new SantaError('NAME_TAKEN', 'Já existe alguém com esse nome neste grupo. Use outro nome.')
        }
        throw error
      }
    },
    async listParticipants(groupId) {
      const result = await tables.listRows({
        databaseId,
        tableId: participantsTableId,
        queries: [Query.equal('groupId', [groupId]), Query.limit(100)],
      })
      return result.rows.map(toParticipant)
    },
    async updateParticipant(id, patch) {
      await tables.updateRow({ databaseId, tableId: participantsTableId, rowId: id, data: patch })
    },
    async deleteParticipant(id) {
      await tables.deleteRow({ databaseId, tableId: participantsTableId, rowId: id })
    },
  }
}
