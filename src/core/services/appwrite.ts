import { Account, Client, Functions, TablesDB } from 'appwrite'

/** Erro de configuração do Appwrite (variáveis de ambiente ausentes). */
export class AppwriteConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppwriteConfigError'
  }
}

type AppwriteInstance = { client: Client; tablesDB: TablesDB; functions: Functions; account: Account }

let instance: AppwriteInstance | null = null
let sessionPromise: Promise<void> | null = null

/**
 * Devolve o cliente Appwrite, criando-o só na primeira chamada.
 * Módulos que não usam back-end nunca chamam esta função.
 */
export function getAppwrite(): AppwriteInstance {
  if (instance) return instance

  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
  if (!endpoint || !projectId) {
    throw new AppwriteConfigError(
      'O Appwrite não está configurado. Defina VITE_APPWRITE_ENDPOINT e VITE_APPWRITE_PROJECT_ID.',
    )
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId)
  instance = { client, tablesDB: new TablesDB(client), functions: new Functions(client), account: new Account(client) }
  return instance
}

/**
 * Garante uma sessão (anônima, se ainda não houver). O Appwrite manda o id dessa sessão à Function,
 * que o usa como dono dos grupos criados. Falhas não derrubam o app: sem sessão, só some o "meus grupos".
 */
export function ensureSession(): Promise<void> {
  sessionPromise ??= (async () => {
    const { account } = getAppwrite()
    try {
      await account.get()
    } catch {
      try {
        await account.createAnonymousSession()
      } catch {
        // Login anônimo desativado ou sem rede: segue sem sessão.
      }
    }
  })()
  return sessionPromise
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

/** Id da Function do amigo secreto. */
export function getSantaFunctionId(): string {
  const functionId = import.meta.env.VITE_APPWRITE_SANTA_FUNCTION_ID
  if (!functionId) {
    throw new AppwriteConfigError('O Appwrite não está configurado. Defina VITE_APPWRITE_SANTA_FUNCTION_ID.')
  }
  return functionId
}

/** Limpa o cliente em cache. Usado apenas nos testes. */
export function resetAppwriteForTests(): void {
  instance = null
  sessionPromise = null
}
