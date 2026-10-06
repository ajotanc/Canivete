import dayjs from 'dayjs'
import { newGroupCode, MAX_CODE_ATTEMPTS } from './lib/code.js'
import { assignSecretFriends } from './lib/draw.js'
import { SantaError } from './lib/errors.js'
import { hashPin, verifyPin } from './lib/pin.js'
import type { RandomInt } from './lib/random.js'
import {
  MAX_ANSWER,
  MAX_PARTICIPANTS,
  MAX_POST,
  MAX_QUESTION,
  MAX_QUESTIONS_PER_PERSON,
  parseBudget,
  parseEventDate,
  parseGroupId,
  parseGroupName,
  parseMessage,
  parsePersonName,
  parsePin,
  parseSlug,
  toSlug,
  parseWishlist,
  toNameKey,
} from './lib/validate.js'
import type { GroupRow, ParticipantRow, SantaDb } from './types.js'

export const LOCK_AFTER_FAILURES = 5
export const LOCK_MINUTES = 15

export interface HandlerDeps {
  now?: () => Date
  randomInt?: RandomInt
  /** Id do usuário da sessão do Appwrite que fez a chamada (cabeçalho x-appwrite-user-id). */
  userId?: string | null
}

type Input = Record<string, unknown>

/** Executa uma ação da Function. Erros esperados são SantaError com mensagem em português. */
export async function handleAction(db: SantaDb, body: unknown, deps: HandlerDeps = {}): Promise<unknown> {
  const input: Input = body !== null && typeof body === 'object' ? (body as Input) : {}
  const now = deps.now ?? (() => dayjs().toDate())

  switch (input.action) {
    case 'createGroup':
      return createGroup(db, input, deps)
    case 'getGroup':
      return getGroup(db, input)
    case 'addParticipant':
      return addParticipant(db, input, deps)
    case 'setupPin':
      return setupPin(db, input)
    case 'listParticipants':
      return listParticipants(db, input, deps)
    case 'removeParticipant':
      return removeParticipant(db, input, deps)
    case 'resetPin':
      return resetPin(db, input, deps)
    case 'updateWishlist':
      return updateWishlist(db, input, now)
    case 'reveal':
      return reveal(db, input, now)
    case 'draw':
      return draw(db, input, deps)
    case 'deleteGroup':
      return deleteGroup(db, input, deps)
    case 'listMyGroups':
      return listMyGroups(db, deps)
    case 'setSlug':
      return setSlug(db, input, deps)
    case 'askQuestion':
      return askQuestion(db, input, now)
    case 'listQuestions':
      return listQuestions(db, input, now)
    case 'answerQuestion':
      return answerQuestion(db, input, now)
    case 'postMessage':
      return postMessage(db, input, now)
    case 'listPosts':
      return listPosts(db, input, now)
    default:
      throw new SantaError('INVALID_INPUT', 'Ação desconhecida.')
  }
}

async function requireGroup(db: SantaDb, rawId: unknown): Promise<GroupRow> {
  const group = await db.getGroup(parseGroupId(rawId))
  if (!group) throw new SantaError('GROUP_NOT_FOUND', 'Grupo não encontrado.')
  return group
}

/** Só o dono do grupo (a conta logada que o criou) administra. */
function requireOrganizer(group: GroupRow, deps: HandlerDeps = {}): void {
  if (!deps.userId || group.ownerId !== deps.userId) {
    throw new SantaError('FORBIDDEN', 'Você não tem permissão para fazer isso neste grupo.')
  }
}

function requireOpen(group: GroupRow): void {
  if (group.status !== 'open') {
    throw new SantaError('GROUP_CLOSED', 'Este grupo já foi sorteado.')
  }
}

async function createGroup(db: SantaDb, input: Input, deps: HandlerDeps) {
  if (!deps.userId) throw new SantaError('FORBIDDEN', 'Entre na sua conta para criar um grupo.')
  const name = parseGroupName(input.name)
  const budget = parseBudget(input.budget)
  const eventDate = parseEventDate(input.eventDate)
  // O texto do link é opcional: vazio vira null.
  const slug = toSlug(input.slug) === '' ? null : parseSlug(input.slug)

  const organizer = input.organizer
  const organizerData =
    organizer !== null && typeof organizer === 'object'
      ? {
          name: parsePersonName((organizer as Input).name),
          pin: parsePin((organizer as Input).pin),
          wishlist: parseWishlist((organizer as Input).wishlist),
        }
      : null

  // O id é um código curto aleatório; sorteia de novo se por azar já existir.
  let groupId = ''
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !groupId; attempt++) {
    const code = newGroupCode(deps.randomInt)
    if ((await db.getGroup(code)) === null) groupId = code
  }
  if (!groupId) throw new SantaError('INTERNAL', 'Não foi possível criar o grupo. Tente de novo.')
  await db.createGroup(groupId, { name, budget, eventDate, status: 'open', ownerId: deps.userId, slug })

  if (organizerData) {
    await db.createParticipant({
      groupId,
      name: organizerData.name,
      nameKey: toNameKey(organizerData.name),
      wishlist: organizerData.wishlist,
      pinHash: await hashPin(organizerData.pin),
      failedAttempts: 0,
      lockedUntil: null,
      assignedToId: null,
      isOrganizer: true,
    })
  }

  return { groupId }
}

async function getGroup(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  const participants = await db.listParticipants(group.id)
  return {
    id: group.id,
    slug: group.slug,
    name: group.name,
    budget: group.budget,
    eventDate: group.eventDate,
    status: group.status,
    participantCount: participants.length,
    // Os nomes não são segredo: a pessoa escolhe o próprio nome para entrar ou criar o PIN.
    members: participants.map((p) => ({ name: p.name, hasPin: p.pinHash !== null })),
  }
}

/** O organizador cadastra uma pessoa pelo nome; ela cria o PIN no primeiro acesso. */
async function addParticipant(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, deps)
  requireOpen(group)

  const name = parsePersonName(input.name)
  const nameKey = toNameKey(name)

  const participants = await db.listParticipants(group.id)
  if (participants.length >= MAX_PARTICIPANTS) {
    throw new SantaError('INVALID_INPUT', `Este grupo já tem ${MAX_PARTICIPANTS} pessoas, que é o limite.`)
  }
  if (participants.some((p) => p.nameKey === nameKey)) {
    throw new SantaError('NAME_TAKEN', 'Já existe alguém com esse nome neste grupo. Use outro nome.')
  }

  await db.createParticipant({
    groupId: group.id,
    name,
    nameKey,
    wishlist: null,
    pinHash: null,
    failedAttempts: 0,
    lockedUntil: null,
    assignedToId: null,
    isOrganizer: false,
  })
  return {}
}

/**
 * Primeiro acesso: a pessoa escolhe o próprio nome e cria o PIN. Vale antes e depois do sorteio;
 * a lista de desejos só é gravada enquanto o grupo está aberto.
 */
async function setupPin(db: SantaDb, input: Input) {
  const pin = parsePin(input.pin)
  const wishlist = parseWishlist(input.wishlist)
  const group = await requireGroup(db, input.groupId)
  const key = toNameKey(typeof input.name === 'string' ? input.name : '')
  const participant = (await db.listParticipants(group.id)).find((p) => p.nameKey === key)
  if (!participant) {
    throw new SantaError('INVALID_INPUT', 'Esse nome não está na lista do grupo. Fale com o organizador.')
  }
  if (participant.pinHash !== null) {
    throw new SantaError(
      'PIN_ALREADY_SET',
      'Essa pessoa já criou o PIN. Entre com ele ou peça ao organizador para zerar.',
    )
  }

  const pinHash = await hashPin(pin)
  await db.updateParticipant(participant.id, {
    pinHash,
    failedAttempts: 0,
    lockedUntil: null,
    ...(group.status === 'open' && wishlist !== null ? { wishlist } : {}),
  })

  // Duas pessoas criando o PIN do mesmo nome ao mesmo tempo: só quem gravou por último fica.
  const saved = (await db.listParticipants(group.id)).find((p) => p.id === participant.id)
  if (saved?.pinHash !== pinHash) {
    throw new SantaError(
      'PIN_ALREADY_SET',
      'Essa pessoa já criou o PIN. Entre com ele ou peça ao organizador para zerar.',
    )
  }
  return {}
}

async function listParticipants(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, deps)
  const participants = await db.listParticipants(group.id)
  return {
    status: group.status,
    participants: participants.map((p) => ({
      name: p.name,
      isOrganizer: p.isOrganizer,
      hasPin: p.pinHash !== null,
    })),
  }
}

async function removeParticipant(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, deps)
  requireOpen(group)

  const key = toNameKey(typeof input.name === 'string' ? input.name : '')
  const target = (await db.listParticipants(group.id)).find((p) => p.nameKey === key)
  if (!target) throw new SantaError('INVALID_INPUT', 'Participante não encontrado.')
  await db.deleteParticipant(target.id)
  return {}
}

/** O organizador zera o PIN de alguém (nome errado no primeiro acesso ou PIN esquecido). */
async function resetPin(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, deps)

  const key = toNameKey(typeof input.name === 'string' ? input.name : '')
  const target = (await db.listParticipants(group.id)).find((p) => p.nameKey === key)
  if (!target) throw new SantaError('INVALID_INPUT', 'Participante não encontrado.')
  await db.updateParticipant(target.id, { pinHash: null, failedAttempts: 0, lockedUntil: null })
  return {}
}

/**
 * Confere nome e PIN. Nome inexistente e PIN errado respondem igual (BAD_CREDENTIALS);
 * quem ainda não criou o PIN recebe PIN_NOT_SET;
 * a 5ª falha seguida bloqueia o participante por 15 minutos.
 */
async function authenticate(
  db: SantaDb,
  input: Input,
  now: () => Date,
): Promise<{ group: GroupRow; participant: ParticipantRow; participants: ParticipantRow[] }> {
  const pin = parsePin(input.pin)
  const group = await requireGroup(db, input.groupId)
  const key = toNameKey(typeof input.name === 'string' ? input.name : '')
  const participants = await db.listParticipants(group.id)
  const participant = participants.find((p) => p.nameKey === key)
  if (!participant) {
    // Confere contra um hash falso para que nome inexistente demore o mesmo que PIN errado.
    await verifyPin(pin, await dummyPinHash())
    throw new SantaError('BAD_CREDENTIALS', 'Nome ou PIN incorretos.')
  }

  if (participant.pinHash === null) {
    throw new SantaError('PIN_NOT_SET', 'Você ainda não criou seu PIN. Faça o primeiro acesso.')
  }

  if (participant.lockedUntil && dayjs(participant.lockedUntil).isAfter(now())) {
    throw lockedError(participant.lockedUntil, now())
  }

  if (!(await verifyPin(pin, participant.pinHash))) {
    const failures = participant.failedAttempts + 1
    if (failures >= LOCK_AFTER_FAILURES) {
      const until = dayjs(now()).add(LOCK_MINUTES, 'minute').toISOString()
      await db.updateParticipant(participant.id, { failedAttempts: 0, lockedUntil: until })
      throw lockedError(until, now())
    }
    await db.updateParticipant(participant.id, { failedAttempts: failures })
    throw new SantaError('BAD_CREDENTIALS', 'Nome ou PIN incorretos.')
  }

  if (participant.failedAttempts > 0 || participant.lockedUntil) {
    await db.updateParticipant(participant.id, { failedAttempts: 0, lockedUntil: null })
  }
  return { group, participant, participants }
}

let dummyHash: Promise<string> | null = null

/** Hash de um PIN qualquer, gerado uma vez por instância da Function. */
function dummyPinHash(): Promise<string> {
  dummyHash ??= hashPin('0000')
  return dummyHash
}

function lockedError(until: string, current: Date): SantaError {
  const minutes = Math.max(1, Math.ceil(dayjs(until).diff(current, 'minute', true)))
  return new SantaError('LOCKED', `Muitas tentativas. Tente de novo em ${minutes} minutos.`)
}

async function updateWishlist(db: SantaDb, input: Input, now: () => Date) {
  const wishlist = parseWishlist(input.wishlist)
  const { group, participant } = await authenticate(db, input, now)
  requireOpen(group)
  await db.updateParticipant(participant.id, { wishlist })
  return {}
}

async function reveal(db: SantaDb, input: Input, now: () => Date) {
  const { group, participant, participants } = await authenticate(db, input, now)

  if (group.status !== 'drawn') {
    return { status: 'open' as const, wishlist: participant.wishlist ?? [] }
  }

  const receiver = participants.find((p) => p.id === participant.assignedToId)
  if (!receiver) {
    throw new SantaError('INTERNAL', 'O sorteio deste grupo está incompleto. Fale com o organizador.')
  }
  return {
    status: 'drawn' as const,
    wishlist: participant.wishlist ?? [],
    receiver: { name: receiver.name, wishlist: receiver.wishlist ?? [] },
  }
}

/**
 * Sorteia o grupo. Passa por `drawing` (que bloqueia novas entradas) e termina em `drawn`.
 * Se algo falhar na gravação, volta para `open` e o organizador pode tentar de novo.
 */
async function draw(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, deps)
  requireOpen(group)

  const participants = await db.listParticipants(group.id)
  const assignments = assignSecretFriends(
    participants.map((p) => p.id),
    deps.randomInt,
  )

  await db.setGroupStatus(group.id, 'drawing')
  try {
    for (const [giverId, receiverId] of assignments) {
      await db.updateParticipant(giverId, { assignedToId: receiverId })
    }
    await db.setGroupStatus(group.id, 'drawn')
  } catch {
    // Desfaz o estado intermediário: `reveal` só revela com o grupo em `drawn`.
    await db.setGroupStatus(group.id, 'open')
    throw new SantaError('INTERNAL', 'Não foi possível concluir o sorteio. Tente de novo.')
  }
  return {}
}

/** O dono apaga o grupo a qualquer momento, com participantes, perguntas e recados. Não dá para desfazer. */
async function deleteGroup(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, deps)
  await db.deleteGroup(group.id)
  return {}
}

/** Grupos da conta logada (vazio sem sessão). */
async function listMyGroups(db: SantaDb, deps: HandlerDeps) {
  if (!deps.userId) return { groups: [] }
  const groups = await db.listGroupsByOwner(deps.userId)
  return { groups: groups.map((g) => ({ id: g.id, slug: g.slug, name: g.name, status: g.status })) }
}

/** Define o texto bonito do link do grupo. Não precisa ser único: quem identifica o grupo é o id. */
async function setSlug(db: SantaDb, input: Input, deps: HandlerDeps) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, deps)
  const slug = parseSlug(input.slug)
  if (slug !== group.slug) await db.setGroupSlug(group.id, slug)
  return { slug }
}

/**
 * Pergunta anônima: vai para a pessoa que o autor tirou, sem dizer quem perguntou.
 * Só depois do sorteio.
 */
async function askQuestion(db: SantaDb, input: Input, now: () => Date) {
  const { group, participant } = await authenticate(db, input, now)
  if (group.status !== 'drawn' || !participant.assignedToId) {
    throw new SantaError('INVALID_INPUT', 'Dá para perguntar só depois do sorteio.')
  }
  const question = parseMessage(input.question, MAX_QUESTION, 'A pergunta')
  const asked = await db.listQuestions(group.id, { fromId: participant.id })
  if (asked.length >= MAX_QUESTIONS_PER_PERSON) {
    throw new SantaError('INVALID_INPUT', `Você já fez ${MAX_QUESTIONS_PER_PERSON} perguntas, que é o limite.`)
  }
  await db.createQuestion({
    groupId: group.id,
    fromId: participant.id,
    toId: participant.assignedToId,
    question,
    answer: null,
  })
  return {}
}

/**
 * `received`: perguntas feitas a mim, sem dizer quem perguntou.
 * `sent`: minhas perguntas, com a resposta quando já existe (só eu vejo).
 */
async function listQuestions(db: SantaDb, input: Input, now: () => Date) {
  const { group, participant } = await authenticate(db, input, now)
  const [received, sent] = await Promise.all([
    db.listQuestions(group.id, { toId: participant.id }),
    db.listQuestions(group.id, { fromId: participant.id }),
  ])
  return {
    received: received.map((q) => ({ id: q.id, question: q.question, answer: q.answer })),
    sent: sent.map((q) => ({ id: q.id, question: q.question, answer: q.answer })),
  }
}

async function answerQuestion(db: SantaDb, input: Input, now: () => Date) {
  const { group, participant } = await authenticate(db, input, now)
  const answer = parseMessage(input.answer, MAX_ANSWER, 'A resposta')
  const question = typeof input.questionId === 'string' ? await db.getQuestion(input.questionId) : null
  // Pergunta de outro grupo ou feita a outra pessoa: mesma resposta que "não existe".
  if (!question || question.groupId !== group.id || question.toId !== participant.id) {
    throw new SantaError('INVALID_INPUT', 'Pergunta não encontrada.')
  }
  await db.answerQuestion(question.id, answer)
  return {}
}

/** Mural do grupo: qualquer participante autenticado escreve e todos veem quem escreveu. */
async function postMessage(db: SantaDb, input: Input, now: () => Date) {
  const { group, participant } = await authenticate(db, input, now)
  const text = parseMessage(input.text, MAX_POST, 'O recado')
  await db.createPost({ groupId: group.id, authorId: participant.id, text })
  return {}
}

async function listPosts(db: SantaDb, input: Input, now: () => Date) {
  const { group, participants } = await authenticate(db, input, now)
  const names = new Map(participants.map((p) => [p.id, p.name]))
  const posts = await db.listPosts(group.id)
  return {
    posts: posts.map((p) => ({
      id: p.id,
      author: names.get(p.authorId) ?? 'Alguém que saiu do grupo',
      text: p.text,
      createdAt: p.createdAt,
    })),
  }
}
