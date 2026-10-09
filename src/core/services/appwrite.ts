import { Account, Client, Functions, TablesDB } from 'appwrite'
import { APPWRITE_IDS, ENV_NAMES, readEnv } from '@/core/config'

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

/** Ids do banco de dados e da tabela de sorteios (fixos, em `APPWRITE_IDS`). */
export function getAppwriteIds(): { databaseId: string; rafflesTableId: string } {
  return { databaseId: APPWRITE_IDS.databaseId, rafflesTableId: APPWRITE_IDS.rafflesTableId }
}

/** Id da Function do amigo secreto (fixo, em `APPWRITE_IDS`). */
export function getSantaFunctionId(): string {
  return APPWRITE_IDS.santaFunctionId
}

/**
 * Endereço público de uma imagem de capa do amigo secreto (o bucket libera leitura para todos).
 * Sem endpoint ou projeto configurados, devolve null e a tela fica só com a cor.
 */
export function santaCoverUrl(fileId: string | null | undefined): string | null {
  const { endpoint, projectId } = readEnv()
  if (!fileId || !endpoint || !projectId) return null
  const bucket = APPWRITE_IDS.santaCoversBucketId
  return `${endpoint.replace(/\/$/, '')}/storage/buckets/${encodeURIComponent(bucket)}/files/${encodeURIComponent(fileId)}/view?project=${encodeURIComponent(projectId)}`
}

/** Limpa o cliente em cache. Usado apenas nos testes. */
export function resetAppwriteForTests(): void {
  instance = null
}
