import dayjs from 'dayjs'
import { Client, ID, Query, TablesDB } from 'node-appwrite'
import { SantaError } from './lib/errors.js'
import { storedPinHash } from './lib/pin.js'
import type { GroupRow, GroupStatus, ParticipantRow, PostRow, QuestionRow, SantaDb } from './types.js'

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
    questionsTableId: env.SANTA_QUESTIONS_TABLE_ID || 'santa_questions',
    postsTableId: env.SANTA_POSTS_TABLE_ID || 'santa_posts',
  }
}

/** Banco real, sobre o Appwrite TablesDB com chave de servidor. */
export function createAppwriteDb(env: Env): SantaDb {
  const config = readConfig(env)
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey)
  const tables = new TablesDB(client)
  const { databaseId, groupsTableId, participantsTableId, questionsTableId, postsTableId } = config

  const toGroup = (row: Record<string, any>): GroupRow => ({
    id: row.$id,
    name: row.name,
    budget: typeof row.budget === 'number' ? row.budget : null,
    eventDate: row.eventDate ?? '',
    organizerTokenHash: row.organizerTokenHash,
    status: row.status as GroupStatus,
    ownerId: row.ownerId ?? null,
    slug: row.slug ?? null,
  })

  const toQuestion = (row: Record<string, any>): QuestionRow => ({
    id: row.$id,
    groupId: row.groupId,
    fromId: row.fromId,
    toId: row.toId,
    question: row.question,
    answer: row.answer ?? null,
  })

  const toPost = (row: Record<string, any>): PostRow => ({
    id: row.$id,
    groupId: row.groupId,
    authorId: row.authorId,
    text: row.text,
    createdAt: dayjs(row.$createdAt).toISOString(),
  })

  const isNotFound = (error: unknown) => (error as { code?: number }).code === 404

  const toParticipant = (row: Record<string, any>): ParticipantRow => ({
    id: row.$id,
    groupId: row.groupId,
    name: row.name,
    nameKey: row.nameKey,
    wishlist: Array.isArray(row.wishlist) && row.wishlist.length > 0 ? row.wishlist : null,
    pinHash: storedPinHash(row.pinHash),
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
    async getGroupBySlug(slug) {
      const result = await tables.listRows({
        databaseId,
        tableId: groupsTableId,
        queries: [Query.equal('slug', [slug]), Query.limit(1)],
      })
      return result.rows[0] ? toGroup(result.rows[0]) : null
    },
    async listGroupsByOwner(ownerId) {
      const result = await tables.listRows({
        databaseId,
        tableId: groupsTableId,
        queries: [Query.equal('ownerId', [ownerId]), Query.orderDesc('$createdAt'), Query.limit(50)],
      })
      return result.rows.map(toGroup)
    },
    async setGroupStatus(id, status) {
      await tables.updateRow({ databaseId, tableId: groupsTableId, rowId: id, data: { status } })
    },
    async setGroupSlug(id, slug) {
      try {
        await tables.updateRow({ databaseId, tableId: groupsTableId, rowId: id, data: { slug } })
      } catch (error) {
        // O índice único em `slug` responde 409 quando dois grupos disputam o mesmo endereço.
        if ((error as { code?: number }).code === 409) {
          throw new SantaError('SLUG_TAKEN', 'Esse endereço já está em uso.')
        }
        throw error
      }
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
     async createQuestion(question) {
      const row = await tables.createRow({ databaseId, tableId: questionsTableId, rowId: ID.unique(), data: question })
      return row.$id
    },
    async getQuestion(id) {
      try {
        return toQuestion(await tables.getRow({ databaseId, tableId: questionsTableId, rowId: id }))
      } catch (error) {
        if (isNotFound(error)) return null
        throw error
      }
    },
    async listQuestions(groupId, filter) {
      const result = await tables.listRows({
        databaseId,
        tableId: questionsTableId,
        queries: [
          Query.equal('groupId', [groupId]),
          'fromId' in filter ? Query.equal('fromId', [filter.fromId]) : Query.equal('toId', [filter.toId]),
          Query.orderAsc('$createdAt'),
          Query.limit(100),
        ],
      })
      return result.rows.map(toQuestion)
    },
    async answerQuestion(id, answer) {
      await tables.updateRow({ databaseId, tableId: questionsTableId, rowId: id, data: { answer } })
    },
    async createPost(post) {
      await tables.createRow({ databaseId, tableId: postsTableId, rowId: ID.unique(), data: post })
    },
    async listPosts(groupId) {
      const result = await tables.listRows({
        databaseId,
        tableId: postsTableId,
        queries: [Query.equal('groupId', [groupId]), Query.orderDesc('$createdAt'), Query.limit(100)],
      })
      return result.rows.map(toPost)
    },
  }
}
