import { SantaError } from '../../../functions/secret-santa/src/lib/errors'
import type { GroupRow, ParticipantRow, PostRow, QuestionRow, SantaDb } from '../../../functions/secret-santa/src/types'

/** Banco em memória que imita o contrato do Appwrite, incluindo a unicidade de (grupo, nome). */
export function createFakeDb() {
  const groups = new Map<string, GroupRow>()
  const participants = new Map<string, ParticipantRow>()
  const questions = new Map<string, QuestionRow>()
  const posts: PostRow[] = []
  let counter = 0
  let updatesLeft: number | null = null

  const db: SantaDb & {
    groups: typeof groups
    participants: typeof participants
    questions: typeof questions
    posts: typeof posts
    failUpdateParticipantAfter(n: number): void
  } = {
    groups,
    participants,
    questions,
    posts,
    failUpdateParticipantAfter(n) {
      updatesLeft = n
    },
    async createGroup(id, group) {
      groups.set(id, { id, ...group })
    },
    async getGroup(id) {
      return groups.get(id) ?? null
    },
    async listGroupsByOwner(ownerId) {
      return [...groups.values()].filter((g) => g.ownerId === ownerId)
    },
    async setGroupColor(id, color) {
      const group = groups.get(id)
      if (group) group.color = color
    },
    async setGroupExclusions(id, exclusions) {
      const group = groups.get(id)
      if (group) group.exclusions = exclusions
    },
    async setGroupSlug(id, slug) {
      const group = groups.get(id)
      if (group) group.slug = slug
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
    async deleteGroup(id) {
      for (const [key, p] of participants) if (p.groupId === id) participants.delete(key)
      for (const [key, q] of questions) if (q.groupId === id) questions.delete(key)
      for (let i = posts.length - 1; i >= 0; i--) if (posts[i].groupId === id) posts.splice(i, 1)
      groups.delete(id)
    },
    async deleteQuestions(groupId) {
      for (const [key, q] of questions) if (q.groupId === groupId) questions.delete(key)
    },
    async deleteParticipant(id) {
      participants.delete(id)
    },
    async createQuestion(question) {
      const id = `q${++counter}`
      questions.set(id, { id, ...question })
      return id
    },
    async getQuestion(id) {
      return questions.get(id) ?? null
    },
    async listQuestions(groupId, filter) {
      return [...questions.values()].filter(
        (q) => q.groupId === groupId && ('fromId' in filter ? q.fromId === filter.fromId : q.toId === filter.toId),
      )
    },
    async answerQuestion(id, answer) {
      const question = questions.get(id)
      if (question) question.answer = answer
    },
    async createPost(post) {
      posts.unshift({ id: `m${++counter}`, createdAt: new Date(1_700_000_000_000 + counter * 1000).toISOString(), ...post })
    },
    async listPosts(groupId) {
      return posts.filter((p) => p.groupId === groupId)
    },
    async getPost(id) {
      return posts.find((p) => p.id === id) ?? null
    },
    async deletePost(id) {
      const index = posts.findIndex((p) => p.id === id)
      if (index >= 0) posts.splice(index, 1)
    },
  }
  return db
}
