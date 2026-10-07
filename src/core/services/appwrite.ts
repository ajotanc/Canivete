import { Account, Client, Functions, TablesDB } from 'appwrite'
import { DEFAULT_RAFFLES_TABLE_ID, ENV_NAMES, readEnv } from '@/core/config'

/** Erro de configuração do Appwrite (variáveis de ambiente ausentes). */
export class AppwriteConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppwriteConfigError'
  }
}

type AppwriteInstance = { client: Client; tablesDB: TablesDB; functions: Functions; account: Account }

let instance: AppwriteInstance | null = null

/**
 * Devolve o cliente Appwrite, criando-o só na primeira chamada.
 * Módulos que não usam back-end nunca chamam esta função.
 */
export function getAppwrite(): AppwriteInstance {
  if (instance) return instance

  const { endpoint, projectId } = readEnv()
  if (!endpoint || !projectId) {
    throw new AppwriteConfigError(
      `O Appwrite não está configurado. Defina ${ENV_NAMES.endpoint} e ${ENV_NAMES.projectId}.`,
    )
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId)
  instance = { client, tablesDB: new TablesDB(client), functions: new Functions(client), account: new Account(client) }
  return instance
}

/** Ids do banco de dados e da tabela de sorteios. */
export function getAppwriteIds(): { databaseId: string; rafflesTableId: string } {
  const { databaseId, rafflesTableId } = readEnv()
  if (!databaseId) {
    throw new AppwriteConfigError(`O Appwrite não está configurado. Defina ${ENV_NAMES.databaseId}.`)
  }
  return { databaseId, rafflesTableId: rafflesTableId || DEFAULT_RAFFLES_TABLE_ID }
}

/** Id da Function do amigo secreto. */
export function getSantaFunctionId(): string {
  const functionId = readEnv().santaFunctionId
  if (!functionId) {
    throw new AppwriteConfigError(`O Appwrite não está configurado. Defina ${ENV_NAMES.santaFunctionId}.`)
  }
  return functionId
}

/** Limpa o cliente em cache. Usado apenas nos testes. */
export function resetAppwriteForTests(): void {
  instance = null
}
