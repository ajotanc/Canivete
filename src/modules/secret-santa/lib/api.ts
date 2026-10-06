import { ExecutionMethod } from 'appwrite'
import { AppwriteConfigError, getAppwrite, getSantaFunctionId } from '@/core/services/appwrite'

export type SantaApiErrorCode =
  | 'INVALID_INPUT'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_CLOSED'
  | 'NAME_TAKEN'
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

  let parsed: { ok: boolean; data?: T; error?: { code: SantaApiErrorCode; message: string } }
  try {
    parsed = JSON.parse(result.responseBody)
  } catch {
    throw new SantaApiError('NETWORK', NETWORK_MESSAGE)
  }

  if (parsed.ok) return parsed.data as T
  throw new SantaApiError(parsed.error?.code ?? 'INTERNAL', parsed.error?.message ?? NETWORK_MESSAGE)
}

export interface Credentials {
  groupId: string
  name: string
  pin: string
}

export interface GroupInfo {
  name: string
  budget: string
  eventDate: string
  status: 'open' | 'drawing' | 'drawn'
  participantCount: number
}

export type RevealResult =
  | { status: 'open'; wishlist: string }
  | { status: 'drawn'; wishlist: string; receiver: { name: string; wishlist: string } }

export function createGroup(
  input: {
    name: string
    budget?: string
    eventDate?: string
    organizer?: { name: string; pin: string; wishlist?: string }
  },
  execute?: Execute,
) {
  return callSanta<{ groupId: string; adminToken: string }>('createGroup', { ...input }, execute)
}

export function getGroup(groupId: string, execute?: Execute) {
  return callSanta<GroupInfo>('getGroup', { groupId }, execute)
}

export function joinGroup(input: Credentials & { wishlist?: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('join', { ...input }, execute)
}

export function updateWishlist(input: Credentials & { wishlist: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('updateWishlist', { ...input }, execute)
}

export function listParticipants(input: { groupId: string; adminToken: string }, execute?: Execute) {
  return callSanta<{ status: GroupInfo['status']; participants: { name: string; isOrganizer: boolean }[] }>(
    'listParticipants',
    { ...input },
    execute,
  )
}

export function removeParticipant(input: { groupId: string; adminToken: string; name: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('removeParticipant', { ...input }, execute)
}

export function drawGroup(input: { groupId: string; adminToken: string }, execute?: Execute) {
  return callSanta<Record<string, never>>('draw', { ...input }, execute)
}

export function revealMatch(input: Credentials, execute?: Execute) {
  return callSanta<RevealResult>('reveal', { ...input }, execute)
}
