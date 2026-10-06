import { Client, TablesDB } from 'appwrite'

/** Erro de configuração do Appwrite (variáveis de ambiente ausentes). */
export class AppwriteConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppwriteConfigError'
  }
}

let instance: { client: Client; tablesDB: TablesDB } | null = null

/**
 * Devolve o cliente Appwrite, criando-o só na primeira chamada.
 * Módulos que não usam back-end nunca chamam esta função.
 */
export function getAppwrite(): { client: Client; tablesDB: TablesDB } {
  if (instance) return instance

  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
  if (!endpoint || !projectId) {
    throw new AppwriteConfigError(
      'O Appwrite não está configurado. Defina VITE_APPWRITE_ENDPOINT e VITE_APPWRITE_PROJECT_ID.',
    )
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId)
  instance = { client, tablesDB: new TablesDB(client) }
  return instance
}

/** Ids do banco de dados e da tabela de sorteios. */
export function getAppwriteIds(): { databaseId: string; rafflesTableId: string } {
  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
  if (!databaseId) {
    throw new AppwriteConfigError(
      'O Appwrite não está configurado. Defina VITE_APPWRITE_DATABASE_ID.',
    )
  }
  return {
    databaseId,
    rafflesTableId: import.meta.env.VITE_APPWRITE_RAFFLES_TABLE_ID || 'raffles',
  }
}

/** Limpa o cliente em cache. Usado apenas nos testes. */
export function resetAppwriteForTests(): void {
  instance = null
}
