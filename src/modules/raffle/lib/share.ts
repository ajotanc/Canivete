import type { Models } from 'appwrite'
import { AppwriteConfigError } from '@/core/services/appwrite'
import { computeHash, verifyRecord, type RaffleRecord } from './verify'

export interface StoredRaffle extends RaffleRecord {
  id: string
  hash: string
}

/** Abstração de armazenamento; a implementação real usa o Appwrite (TablesDB). */
export interface RaffleStore {
  create(data: RaffleRecord & { hash: string }): Promise<string>
  get(id: string): Promise<StoredRaffle | null>
}

export class ShareError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'NETWORK' | 'CONFIG',
    message: string,
  ) {
    super(message)
    this.name = 'ShareError'
  }
}

/** Formato de uma linha da tabela como o Appwrite a devolve. */
export interface RaffleRow {
  $id: string
  participants: string[]
  winners: string[]
  drawnAt: string
  hash: string
}

/**
 * Converte a linha do Appwrite em StoredRaffle.
 * Colunas datetime voltam como "...000+00:00"; normalizamos para o ISO com "Z" usado no hash.
 */
export function rowToStored(row: RaffleRow): StoredRaffle {
  const date = new Date(row.drawnAt)
  return {
    id: row.$id,
    participants: row.participants,
    winners: row.winners,
    drawnAt: Number.isNaN(date.getTime()) ? row.drawnAt : date.toISOString(),
    hash: row.hash,
  }
}

/** Ids de linha aceitos pelo Appwrite: até 36 caracteres, sem caractere especial no início. */
const ROW_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/

/**
 * Trata um erro de getRow: devolve null só quando a linha não existe.
 * Tabela ou banco inexistente é problema de configuração, não de link.
 */
export function handleGetRowError(error: unknown): null {
  const { code, type } = error as { code?: number; type?: string }
  if (code === 404 && type === 'row_not_found') return null
  if (code === 404) {
    throw new AppwriteConfigError('A tabela ou o banco de dados do Appwrite não foi encontrado.')
  }
  throw error
}

/** Traduz qualquer falha do armazenamento para um ShareError com mensagem em português. */
function toShareError(error: unknown): ShareError {
  if (error instanceof ShareError) return error
  if (error instanceof AppwriteConfigError) {
    return new ShareError('CONFIG', 'O compartilhamento ainda não está configurado neste site.')
  }
  return new ShareError('NETWORK', 'Não foi possível falar com o servidor. Tente novamente em instantes.')
}

/**
 * Implementação real da store, sobre o Appwrite (TablesDB).
 * O serviço é importado sob demanda para que o SDK só carregue quando for necessário.
 */
export async function createAppwriteStore(): Promise<RaffleStore> {
  const { ID } = await import('appwrite')
  const { getAppwrite, getAppwriteIds } = await import('@/core/services/appwrite')
  const { tablesDB } = getAppwrite()
  const { databaseId, rafflesTableId } = getAppwriteIds()

  return {
    async create(data) {
      const row = await tablesDB.createRow({
        databaseId,
        tableId: rafflesTableId,
        rowId: ID.unique(),
        data,
      })
      return row.$id
    },
    async get(id) {
      try {
        const row = await tablesDB.getRow<RaffleRow & Models.Row>({
          databaseId,
          tableId: rafflesTableId,
          rowId: id,
        })
        return rowToStored(row)
      } catch (error) {
        return handleGetRowError(error)
      }
    },
  }
}

/** Grava um sorteio imutável e devolve o id da linha. */
export async function createShare(record: RaffleRecord, store?: RaffleStore): Promise<string> {
  try {
    const target = store ?? (await createAppwriteStore())
    const hash = await computeHash(record)
    return await target.create({ ...record, hash })
  } catch (error) {
    throw toShareError(error)
  }
}

/** Lê um sorteio compartilhado e confere se o hash ainda bate. */
export async function loadShare(
  id: string,
  store?: RaffleStore,
): Promise<{ raffle: StoredRaffle; verified: boolean }> {
  // Ids fora do formato do Appwrite nunca existem: nem consulta o servidor.
  if (!ROW_ID_PATTERN.test(id)) throw new ShareError('NOT_FOUND', 'Sorteio não encontrado.')
  try {
    const source = store ?? (await createAppwriteStore())
    const raffle = await source.get(id)
    if (!raffle) throw new ShareError('NOT_FOUND', 'Sorteio não encontrado.')
    return { raffle, verified: await verifyRecord(raffle) }
  } catch (error) {
    throw toShareError(error)
  }
}
