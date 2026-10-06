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
        const row = await tablesDB.getRow<
          RaffleRecord & { hash: string } & Models.Row
        >({ databaseId, tableId: rafflesTableId, rowId: id })
        return {
          id: row.$id,
          participants: row.participants,
          winners: row.winners,
          drawnAt: row.drawnAt,
          hash: row.hash,
        }
      } catch (error) {
        // O Appwrite responde com code 404 quando a linha não existe.
        if ((error as { code?: number }).code === 404) return null
        throw error
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
  try {
    const source = store ?? (await createAppwriteStore())
    const raffle = await source.get(id)
    if (!raffle) throw new ShareError('NOT_FOUND', 'Sorteio não encontrado.')
    return { raffle, verified: await verifyRecord(raffle) }
  } catch (error) {
    throw toShareError(error)
  }
}
