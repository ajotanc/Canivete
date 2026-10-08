export type GroupStatus = 'open' | 'drawing' | 'drawn'

export interface GroupRow {
  id: string
  name: string
  /** Valor sugerido em reais; null quando não informado. */
  budget: number | null
  /** AAAA-MM-DD; vazio quando não informado. */
  eventDate: string
  status: GroupStatus
  /** Id da conta (Appwrite Auth) do organizador que criou o grupo. */
  ownerId: string
  /** Endereço amigável opcional, que pode se repetir entre os grupos (ex.: familia-da-bagunca). */
  slug: string | null
  /** Pares de ids ("idA|idB", em ordem) que não podem se tirar. */
  exclusions: string[]
  /** Cor do grupo; null vale framboesa. */
  color: string | null
}

export interface ParticipantRow {
  id: string
  groupId: string
  name: string
  nameKey: string
  /** Itens da lista de desejos; null enquanto a pessoa não escreveu nada. */
  wishlist: string[] | null
  /** Hash scrypt do PIN; null enquanto a pessoa não fez o primeiro acesso. */
  pinHash: string | null
  failedAttempts: number
  /** ISO com Z, ou null quando não está bloqueado. */
  lockedUntil: string | null
  assignedToId: string | null
  isOrganizer: boolean
  /** True quando a pessoa já abriu a carta e viu quem tirou. */
  revealed: boolean
}

export interface QuestionRow {
  id: string
  groupId: string
  /** Quem perguntou (nunca é mostrado a quem recebe). */
  fromId: string
  /** Quem recebe a pergunta: a pessoa que o autor tirou. */
  toId: string
  question: string
  answer: string | null
}

export interface PostRow {
  id: string
  groupId: string
  authorId: string
  text: string
  /** ISO com Z. */
  createdAt: string
}

/** Acesso ao banco. A implementação real usa o Appwrite; os testes usam um banco em memória. */
export interface SantaDb {
  createGroup(id: string, group: Omit<GroupRow, 'id'>): Promise<void>
  getGroup(id: string): Promise<GroupRow | null>
  listGroupsByOwner(ownerId: string): Promise<GroupRow[]>
  setGroupStatus(id: string, status: GroupStatus): Promise<void>
  /** Troca nome, valor sugerido e data da troca. */
  updateGroup(id: string, patch: Pick<GroupRow, 'name' | 'budget' | 'eventDate'>): Promise<void>
  /** Troca o texto do link (não é único). */
  setGroupSlug(id: string, slug: string): Promise<void>
  setGroupExclusions(id: string, exclusions: string[]): Promise<void>
  setGroupColor(id: string, color: string): Promise<void>
  /** Apaga o grupo e tudo dele: participantes, perguntas e recados. */
  deleteGroup(id: string): Promise<void>
  createParticipant(participant: Omit<ParticipantRow, 'id'>): Promise<string>
  listParticipants(groupId: string): Promise<ParticipantRow[]>
  updateParticipant(id: string, patch: Partial<Omit<ParticipantRow, 'id'>>): Promise<void>
  deleteParticipant(id: string): Promise<void>
  /** Apaga todas as perguntas do grupo (ao refazer o sorteio). */
  deleteQuestions(groupId: string): Promise<void>
  createQuestion(question: Omit<QuestionRow, 'id'>): Promise<string>
  getQuestion(id: string): Promise<QuestionRow | null>
  /** Perguntas feitas por (`fromId`) ou recebidas por (`toId`) uma pessoa, da mais antiga à mais nova. */
  listQuestions(groupId: string, filter: { fromId: string } | { toId: string }): Promise<QuestionRow[]>
  answerQuestion(id: string, answer: string): Promise<void>
  createPost(post: Omit<PostRow, 'id' | 'createdAt'>): Promise<void>
  /** Recados do mural, do mais novo ao mais antigo. */
  listPosts(groupId: string): Promise<PostRow[]>
  getPost(id: string): Promise<PostRow | null>
  deletePost(id: string): Promise<void>
}
