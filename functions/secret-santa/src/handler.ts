import dayjs from 'dayjs'
import { SantaError } from './lib/errors.js'
import { hashPin, verifyPin } from './lib/pin.js'
import type { RandomInt } from './lib/random.js'
import { generateToken, hashToken, tokenMatches } from './lib/tokens.js'
import {
  MAX_PARTICIPANTS,
  parseBudget,
  parseEventDate,
  parseGroupId,
  parseGroupName,
  parsePersonName,
  parsePin,
  parseWishlist,
  toNameKey,
} from './lib/validate.js'
import type { GroupRow, ParticipantRow, SantaDb } from './types.js'

export const LOCK_AFTER_FAILURES = 5
export const LOCK_MINUTES = 15

export interface HandlerDeps {
  now?: () => Date
  randomInt?: RandomInt
}

type Input = Record<string, unknown>

/** Executa uma ação da Function. Erros esperados são SantaError com mensagem em português. */
export async function handleAction(db: SantaDb, body: unknown, deps: HandlerDeps = {}): Promise<unknown> {
  const input: Input = body !== null && typeof body === 'object' ? (body as Input) : {}
  const now = deps.now ?? (() => dayjs().toDate())

  switch (input.action) {
    case 'createGroup':
      return createGroup(db, input)
    case 'getGroup':
      return getGroup(db, input)
    case 'join':
      return join(db, input)
    case 'listParticipants':
      return listParticipants(db, input)
    case 'removeParticipant':
      return removeParticipant(db, input)
    case 'updateWishlist':
      return updateWishlist(db, input, now)
    case 'reveal':
      return reveal(db, input, now)
    default:
      throw new SantaError('INVALID_INPUT', 'Ação desconhecida.')
  }
}

async function requireGroup(db: SantaDb, rawId: unknown): Promise<GroupRow> {
  const group = await db.getGroup(parseGroupId(rawId))
  if (!group) throw new SantaError('GROUP_NOT_FOUND', 'Grupo não encontrado.')
  return group
}

function requireOrganizer(group: GroupRow, token: unknown): void {
  if (!tokenMatches(token, group.organizerTokenHash)) {
    throw new SantaError('FORBIDDEN', 'Você não tem permissão para fazer isso neste grupo.')
  }
}

function requireOpen(group: GroupRow): void {
  if (group.status !== 'open') {
    throw new SantaError('GROUP_CLOSED', 'Este grupo já foi sorteado.')
  }
}

async function createGroup(db: SantaDb, input: Input) {
  const name = parseGroupName(input.name)
  const budget = parseBudget(input.budget)
  const eventDate = parseEventDate(input.eventDate)

  const organizer = input.organizer
  const organizerData =
    organizer !== null && typeof organizer === 'object'
      ? {
          name: parsePersonName((organizer as Input).name),
          pin: parsePin((organizer as Input).pin),
          wishlist: parseWishlist((organizer as Input).wishlist),
        }
      : null

  const adminToken = generateToken()
  const groupId = await db.createGroup({
    name,
    budget,
    eventDate,
    organizerTokenHash: hashToken(adminToken),
    status: 'open',
  })

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

  return { groupId, adminToken }
}

async function getGroup(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  const participants = await db.listParticipants(group.id)
  return {
    name: group.name,
    budget: group.budget,
    eventDate: group.eventDate,
    status: group.status,
    participantCount: participants.length,
  }
}

async function join(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  requireOpen(group)

  const name = parsePersonName(input.name)
  const pin = parsePin(input.pin)
  const wishlist = parseWishlist(input.wishlist)
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
    wishlist,
    pinHash: await hashPin(pin),
    failedAttempts: 0,
    lockedUntil: null,
    assignedToId: null,
    isOrganizer: false,
  })
  return {}
}

async function listParticipants(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, input.adminToken)
  const participants = await db.listParticipants(group.id)
  return {
    status: group.status,
    participants: participants.map((p) => ({ name: p.name, isOrganizer: p.isOrganizer })),
  }
}

async function removeParticipant(db: SantaDb, input: Input) {
  const group = await requireGroup(db, input.groupId)
  requireOrganizer(group, input.adminToken)
  requireOpen(group)

  const key = toNameKey(typeof input.name === 'string' ? input.name : '')
  const target = (await db.listParticipants(group.id)).find((p) => p.nameKey === key)
  if (!target) throw new SantaError('INVALID_INPUT', 'Participante não encontrado.')
  await db.deleteParticipant(target.id)
  return {}
}

/**
 * Confere nome e PIN. Nome inexistente e PIN errado respondem igual (BAD_CREDENTIALS);
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
    return { status: 'open' as const, wishlist: participant.wishlist }
  }

  const receiver = participants.find((p) => p.id === participant.assignedToId)
  if (!receiver) {
    throw new SantaError('INTERNAL', 'O sorteio deste grupo está incompleto. Fale com o organizador.')
  }
  return {
    status: 'drawn' as const,
    wishlist: participant.wishlist,
    receiver: { name: receiver.name, wishlist: receiver.wishlist },
  }
}
