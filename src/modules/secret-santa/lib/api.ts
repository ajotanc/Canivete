import { ExecutionMethod } from 'appwrite'
import { AppwriteConfigError, ensureSession, getAppwrite, getSantaFunctionId } from '@/core/services/appwrite'

export type SantaApiErrorCode =
  | 'INVALID_INPUT'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_CLOSED'
  | 'NAME_TAKEN'
  | 'SLUG_TAKEN'
  | 'PIN_NOT_SET'
  | 'PIN_ALREADY_SET'
  | 'BAD_CREDENTIALS'
  | 'LOCKED'
  | 'NOT_ENOUGH_PARTICIPANTS'
  | 'FORBIDDEN'
  | 'INTERNAL'
  | 'NETWORK'
  | 'CONFIG'

export class SantaApiError extends Error {
  constructor(
    public readonly code: SantaApiErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'SantaApiError'
  }
}

export type Execute = (body: string) => Promise<{ responseStatusCode: number; responseBody: string }>

/** Execução real: chama a Function do amigo secreto pelo SDK web do Appwrite. */
const executeOnAppwrite: Execute = async (body) => {
  await ensureSession()
  const { functions } = getAppwrite()
  const execution = await functions.createExecution({
    functionId: getSantaFunctionId(),
    body,
    async: false,
    method: ExecutionMethod.POST,
  })
  return { responseStatusCode: execution.responseStatusCode, responseBody: execution.responseBody }
}

const NETWORK_MESSAGE = 'Não foi possível falar com o servidor. Tente novamente em instantes.'

/** Chama uma ação da Function e devolve os dados, ou lança SantaApiError com mensagem em português. */
export async function callSanta<T>(
  action: string,
  params: Record<string, unknown>,
  execute: Execute = executeOnAppwrite,
): Promise<T> {
  let result: { responseStatusCode: number; responseBody: string }
  try {
    result = await execute(JSON.stringify({ action, ...params }))
  } catch (error) {
    if (error instanceof AppwriteConfigError) {
      throw new SantaApiError('CONFIG', 'O amigo secreto ainda não está configurado neste site.')
    }
    throw new SantaApiError('NETWORK', NETWORK_MESSAGE)
  }

  let parsed: { ok: boolean; data?: T; error?: { code: SantaApiErrorCode; message: string; details?: Record<string, unknown> } }
  try {
    parsed = JSON.parse(result.responseBody)
  } catch {
    throw new SantaApiError('NETWORK', NETWORK_MESSAGE)
  }

  if (parsed.ok) return parsed.data as T
  throw new SantaApiError(parsed.error?.code ?? 'INTERNAL', parsed.error?.message ?? NETWORK_MESSAGE, parsed.error?.details)
}

export interface Credentials {
  groupId: string
  name: string
  pin: string
}

export interface GroupInfo {
  id: string
  /** Endereço amigável, quando o organizador definiu um. */
  slug: string | null
  name: string
  /** Valor sugerido em reais. */
  budget: number | null
  eventDate: string
  status: 'open' | 'drawing' | 'drawn'
  participantCount: number
  /** Nomes do grupo e se cada pessoa já criou o PIN (primeiro acesso). */
  members: { name: string; hasPin: boolean }[]
}

export interface ParticipantSummary {
  name: string
  isOrganizer: boolean
  hasPin: boolean
}

export type RevealResult =
  | { status: 'open'; wishlist: string[] }
  | { status: 'drawn'; wishlist: string[]; receiver: { name: string; wishlist: string[] } }

export interface MyGroup {
  id: string
  slug: string | null
  name: string
  status: GroupInfo['status']
}

export interface QuestionItem {
  id: string
  question: string
  answer: string | null
}

export interface BoardPost {
  id: string
  author: string
  text: string
  createdAt: string
}

export function createGroup(
  input: {
    name: string
    budget?: number | null
    eventDate?: string
    organizer?: { name: string; pin: string; wishlist?: string[] }
  },
  execute?: Execute,
) {
  return callSanta<{ groupId: string; adminToken: string }>('createGroup', { ...input }, execute)
}

export function getGroup(groupId: string, execute?: Execute) {
  return callSanta<GroupInfo>('getGroup', { groupId }, execute)
}

/** Primeiro acesso: a pessoa escolhe o próprio nome e cria o PIN. */
export function setupPin(input: Credentials & { wishlist?: string[] }, execute?: Execute) {
  return callSanta<Record<string, never>>('setupPin', { ...input }, execute)
}

export function updateWishlist(input: Credentials & { wishlist: string[] }, execute?: Execute) {
  return callSanta<Record<string, never>>('updateWishlist', { ...input }, execute)
}

export function listParticipants(input: { groupId: string; adminToken?: string }, execute?: Execute) {
  return callSanta<{ status: GroupInfo['status']; participants: ParticipantSummary[] }>(
    'listParticipants',
    { ...input },
    execute,
  )
}

export function addParticipant(input: { groupId: string; adminToken?: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('addParticipant', { ...input }, execute)
}

export function resetPin(input: { groupId: string; adminToken?: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('resetPin', { ...input }, execute)
}

export function removeParticipant(input: { groupId: string; adminToken?: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('removeParticipant', { ...input }, execute)
}

export function drawGroup(input: { groupId: string; adminToken?: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('draw', { ...input }, execute)
}

export function revealMatch(input: Credentials, execute?: Execute) {
  return callSanta<RevealResult>('reveal', { ...input }, execute)
}

/** Grupos criados por esta sessão (precisa da sessão anônima do Appwrite). */
export function listMyGroups(execute?: Execute) {
  return callSanta<{ groups: MyGroup[] }>('listMyGroups', {}, execute)
}

/** `adminToken` é opcional: o dono do grupo entra pela sessão. */
export function setSlug(input: { groupId: string; adminToken?: string; slug: string }, execute?: Execute) {
  return callSanta<{ slug: string }>('setSlug', { ...input }, execute)
}

export function askQuestion(input: Credentials & { question: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('askQuestion', { ...input }, execute)
}

export function listQuestions(input: Credentials, execute?: Execute) {
  return callSanta<{ received: QuestionItem[]; sent: QuestionItem[] }>('listQuestions', { ...input }, execute)
}

export function answerQuestion(input: Credentials & { questionId: string; answer: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('answerQuestion', { ...input }, execute)
}

export function postMessage(input: Credentials & { text: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('postMessage', { ...input }, execute)
}

export function listPosts(input: Credentials, execute?: Execute) {
  return callSanta<{ posts: BoardPost[] }>('listPosts', { ...input }, execute)
}
