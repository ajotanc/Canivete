import { describe, expect, it } from 'vitest'
import { AppwriteConfigError } from '@/core/services/appwrite'
import { createShare, loadShare, ShareError, type RaffleStore, type StoredRaffle } from '@/modules/raffle/lib/share'
import { computeHash } from '@/modules/raffle/lib/verify'

const record = {
  participants: ['Ana', 'Bruno'],
  winners: ['Ana'],
  drawnAt: '2026-10-05T12:00:00.000Z',
}

/** Store em memória que imita o Appwrite. */
function memoryStore(): RaffleStore & { docs: Map<string, StoredRaffle> } {
  const docs = new Map<string, StoredRaffle>()
  return {
    docs,
    async create(data) {
      const id = `id${docs.size + 1}`
      docs.set(id, { id, ...data })
      return id
    },
    async get(id) {
      return docs.get(id) ?? null
    },
  }
}

describe('createShare', () => {
  it('grava o registro com o hash correto e devolve o id', async () => {
    const store = memoryStore()
    const id = await createShare(record, store)
    expect(store.docs.get(id)?.hash).toBe(await computeHash(record))
  })

  it('converte falhas da store em ShareError NETWORK', async () => {
    const store: RaffleStore = {
      create: async () => {
        throw new Error('offline')
      },
      get: async () => null,
    }
    await expect(createShare(record, store)).rejects.toMatchObject({ code: 'NETWORK' })
  })

  it('converte erro de configuração em ShareError CONFIG', async () => {
    const store: RaffleStore = {
      create: async () => {
        throw new AppwriteConfigError('faltam variáveis')
      },
      get: async () => null,
    }
    await expect(createShare(record, store)).rejects.toMatchObject({ code: 'CONFIG' })
  })
})

describe('loadShare', () => {
  it('lê e confirma um registro íntegro', async () => {
    const store = memoryStore()
    const id = await createShare(record, store)
    const result = await loadShare(id, store)
    expect(result.verified).toBe(true)
    expect(result.raffle.winners).toEqual(['Ana'])
  })

  it('marca como não verificado quando o conteúdo foi alterado', async () => {
    const store = memoryStore()
    const id = await createShare(record, store)
    store.docs.set(id, { ...store.docs.get(id)!, winners: ['Bruno'] })
    expect((await loadShare(id, store)).verified).toBe(false)
  })

  it('lança NOT_FOUND para id inexistente', async () => {
    await expect(loadShare('nada', memoryStore())).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(loadShare('nada', memoryStore())).rejects.toBeInstanceOf(ShareError)
  })

  it('converte falhas da store em ShareError NETWORK', async () => {
    const store: RaffleStore = {
      create: async () => 'x',
      get: async () => {
        throw new Error('offline')
      },
    }
    await expect(loadShare('x', store)).rejects.toMatchObject({ code: 'NETWORK' })
  })
})
