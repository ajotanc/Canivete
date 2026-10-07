/**
 * Configuração central do núcleo do site: variáveis de ambiente e constantes compartilhadas.
 * Cada módulo tem o seu próprio `constants.ts`; o núcleo nunca importa de um módulo.
 */

/** Variáveis de ambiente do site (documentadas em `.env.example`). */
export interface SiteEnv {
  endpoint: string | undefined
  projectId: string | undefined
  databaseId: string | undefined
  rafflesTableId: string | undefined
  santaFunctionId: string | undefined
}

/**
 * Lê as variáveis no momento da chamada (e não ao carregar o arquivo), para os testes poderem trocá-las.
 * O acesso a `import.meta.env.VITE_*` precisa ser escrito por extenso: é assim que o Vite o substitui no build.
 */
export function readEnv(): SiteEnv {
  return {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    rafflesTableId: import.meta.env.VITE_APPWRITE_RAFFLES_TABLE_ID,
    santaFunctionId: import.meta.env.VITE_APPWRITE_SANTA_FUNCTION_ID,
  }
}

/** Nomes das variáveis, usados nas mensagens de configuração incompleta. */
export const ENV_NAMES = {
  endpoint: 'VITE_APPWRITE_ENDPOINT',
  projectId: 'VITE_APPWRITE_PROJECT_ID',
  databaseId: 'VITE_APPWRITE_DATABASE_ID',
  santaFunctionId: 'VITE_APPWRITE_SANTA_FUNCTION_ID',
} as const

/** Id da tabela de sorteios quando `VITE_APPWRITE_RAFFLES_TABLE_ID` não está definida. */
export const DEFAULT_RAFFLES_TABLE_ID = 'raffles'

/** Chave onde o tema escolhido fica salvo no navegador. */
export const THEME_STORAGE_KEY = 'canivete-theme'

/** Seletor de data: quantos anos à frente do atual o seletor de ano oferece. */
export const DATE_PICKER = { yearsAhead: 2 } as const

/** Chuva de confetes. */
export const CONFETTI = {
  /** Cores padrão (família das cores de ferramenta). */
  colors: ['#2457F5', '#0E7C57', '#E5322D', '#F2B600', '#FFFFFF'],
  durationMs: 3000,
  /** Quanto o canvas leva para sumir depois que a chuva termina. */
  fadeMs: 3500,
  /** Com "reduzir movimento" ligado, a chuva nunca passa disto. */
  reducedMotionMaxMs: 1800,
} as const
