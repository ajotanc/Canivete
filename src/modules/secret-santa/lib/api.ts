import { ExecutionMethod } from 'appwrite'
import { AppwriteConfigError, getAppwrite, getSantaFunctionId } from '@/core/services/appwrite'
import { MESSAGES } from '../constants'

export type SantaApiErrorCode =
  | 'INVALID_INPUT'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_CLOSED'
  | 'NAME_TAKEN'
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
  const { functions } = getAppwrite()
  const execution = await functions.createExecution({
    functionId: getSantaFunctionId(),
    body,
    async: false,
    method: ExecutionMethod.POST,
  })
  return { responseStatusCode: execution.responseStatusCode, responseBody: execution.responseBody }
}

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
    throw new SantaApiError('NETWORK', MESSAGES.network)
  }

  let parsed: { ok: boolean; data?: T; error?: { code: SantaApiErrorCode; message: string; details?: Record<string, unknown> } }
  try {
    parsed = JSON.parse(result.responseBody)
  } catch {
    throw new SantaApiError('NETWORK', MESSAGES.network)
  }

  if (parsed.ok) return parsed.data as T
  throw new SantaApiError(parsed.error?.code ?? 'INTERNAL', parsed.error?.message ?? MESSAGES.network, parsed.error?.details)
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
  /** Cor do grupo: uma da lista ou #RRGGBB; framboesa quando o organizador não escolheu. */
  color: string
  /** Id da imagem de capa no bucket (`santaCoverUrl` monta o endereço); null sem imagem. Ausente numa Function antiga. */
  cover?: string | null
  /** Nomes do grupo e se cada pessoa já criou o PIN (primeiro acesso). */
  members: { name: string; hasPin: boolean }[]
}

export interface ParticipantSummary {
  name: string
  isOrganizer: boolean
  hasPin: boolean
  /** Já abriu a carta e viu quem tirou. Ausente quando a Function publicada é antiga. */
  revealed?: boolean
}

/** Um presente da lista; `url` é o link do produto, quando a pessoa tem. */
export interface WishItem {
  text: string
  url?: string
}

export type RevealResult =
  | { status: 'open'; wishlist: WishItem[] }
  | { status: 'drawn'; wishlist: WishItem[]; receiver: { name: string; wishlist: WishItem[] } }

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
  /** Quem escreveu e o organizador podem apagar. */
  canDelete: boolean
}

export function createGroup(
  input: {
    name: string
    /** Texto do link; vazio ou ausente deixa só o id. */
    slug?: string
    budget?: number | null
    eventDate?: string
    organizer?: { name: string; pin: string; wishlist?: WishItem[] }
  },
  execute?: Execute,
) {
  return callSanta<{ groupId: string }>('createGroup', { ...input }, execute)
}

export function getGroup(groupId: string, execute?: Execute) {
  return callSanta<GroupInfo>('getGroup', { groupId }, execute)
}

/** Corrige nome, valor sugerido (em reais, ou null) e data da troca (AAAA-MM-DD, ou vazio). */
export function updateGroup(
  input: { groupId: string; name: string; budget: number | null; eventDate: string },
  execute?: Execute,
) {
  return callSanta<{ name: string; budget: number | null; eventDate: string }>('updateGroup', { ...input }, execute)
}

/** Corrige o nome de uma pessoa; pares, PIN e regras de exclusão continuam valendo. */
export function renameParticipant(input: { groupId: string; name: string; newName: string }, execute?: Execute) {
  return callSanta<{ name: string }>('renameParticipant', { ...input }, execute)
}

/** Primeiro acesso: a pessoa escolhe o próprio nome e cria o PIN. */
export function setupPin(input: Credentials & { wishlist?: WishItem[] }, execute?: Execute) {
  return callSanta<Record<string, never>>('setupPin', { ...input }, execute)
}

export function updateWishlist(input: Credentials & { wishlist: WishItem[] }, execute?: Execute) {
  return callSanta<Record<string, never>>('updateWishlist', { ...input }, execute)
}

export function listParticipants(input: { groupId: string }, execute?: Execute) {
  return callSanta<{ status: GroupInfo['status']; participants: ParticipantSummary[]; exclusions: [string, string][]; anyRevealed: boolean }>(
    'listParticipants',
    { ...input },
    execute,
  )
}

/** Pares de nomes que não podem se tirar (valem nos dois sentidos). */
export function setExclusions(input: { groupId: string; exclusions: [string, string][] }, execute?: Execute) {
  return callSanta<Record<string, never>>('setExclusions', { ...input }, execute)
}

/** A pessoa abriu a carta: a partir daí o sorteio não pode mais ser refeito. */
export function markRevealed(input: Credentials, execute?: Execute) {
  return callSanta<Record<string, never>>('markRevealed', { ...input }, execute)
}

/** Desfaz o sorteio e reabre o grupo; só funciona se ninguém abriu a carta. */
export function resetDraw(input: { groupId: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('resetDraw', { ...input }, execute)
}

export function setColor(input: { groupId: string; color: string }, execute?: Execute) {
  return callSanta<{ color: string }>('setColor', { ...input }, execute)
}

/** Põe ou troca a imagem de capa (`image`: WebP em base64) ou tira (`image: null`); a anterior sai do bucket. */
export function setCover(input: { groupId: string; image: string | null }, execute?: Execute) {
  return callSanta<{ cover: string | null }>('setCover', { ...input }, execute)
}

export function addParticipant(input: { groupId: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('addParticipant', { ...input }, execute)
}

export function resetPin(input: { groupId: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('resetPin', { ...input }, execute)
}

export function removeParticipant(input: { groupId: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('removeParticipant', { ...input }, execute)
}

export function deleteGroup(input: { groupId: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('deleteGroup', { ...input }, execute)
}

export function drawGroup(input: { groupId: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('draw', { ...input }, execute)
}

export function revealMatch(input: Credentials, execute?: Execute) {
  return callSanta<RevealResult>('reveal', { ...input }, execute)
}

/** Grupos da conta logada. */
export function listMyGroups(execute?: Execute) {
  return callSanta<{ groups: MyGroup[] }>('listMyGroups', {}, execute)
}

export function setSlug(input: { groupId: string; slug: string }, execute?: Execute) {
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

/** Sem nome e PIN, só a conta do organizador consegue ler o mural. */
export function deletePost(input: { groupId: string; postId: string } & Partial<Credentials>, execute?: Execute) {
  return callSanta<Record<string, never>>('deletePost', { ...input }, execute)
}

export function listPosts(input: { groupId: string } & Partial<Credentials>, execute?: Execute) {
  return callSanta<{ posts: BoardPost[] }>('listPosts', { ...input }, execute)
}
