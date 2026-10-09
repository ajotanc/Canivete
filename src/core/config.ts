/**
 * Configuração central do núcleo do site: variáveis de ambiente e constantes compartilhadas.
 * Cada módulo tem o seu próprio `constants.ts`; o núcleo nunca importa de um módulo.
 */

/**
 * Variáveis de ambiente do site (documentadas em `.env.example`): só o que muda de um Appwrite para outro,
 * o endereço e o projeto. Banco, tabelas, função e bucket são fixos e ficam em `APPWRITE_IDS`.
 */
export interface SiteEnv {
  endpoint: string | undefined
  projectId: string | undefined
}

/**
 * Lê as variáveis no momento da chamada (e não ao carregar o arquivo), para os testes poderem trocá-las.
 * O acesso a `import.meta.env.VITE_*` precisa ser escrito por extenso: é assim que o Vite o substitui no build.
 */
export function readEnv(): SiteEnv {
  return {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  }
}

/** Nomes das variáveis, usados nas mensagens de configuração incompleta. */
export const ENV_NAMES = {
  endpoint: 'VITE_APPWRITE_ENDPOINT',
  projectId: 'VITE_APPWRITE_PROJECT_ID',
} as const

/**
 * Ids dos recursos do Appwrite que o site usa. Não mudam entre ambientes, então ficam no código e não no `.env`.
 * O bucket das capas é o mesmo que a Function usa (`BUCKETS.covers` em `functions/secret-santa/src/config.ts`).
 */
export const APPWRITE_IDS = {
  /** Banco do sorteador (e das tabelas do amigo secreto, lidas só pela Function). */
  databaseId: '6ac4600700188c531e4f',
  rafflesTableId: 'raffles',
  santaFunctionId: 'secret-santa',
  santaCoversBucketId: 'santa_covers',
} as const

/**
 * Política de privacidade e termos de uso (`/privacy` e `/terms`).
 * `updatedAt` aparece nas duas páginas; ao mudar o texto de uma delas, troque a data, e o aviso de cookies volta a aparecer.
 */
export const LEGAL = {
  contactEmail: 'ajotanc@gmail.com',
  updatedAt: '2026-10-09',
  /** Onde fica guardado que a pessoa já viu o aviso de cookies (vale a data de `updatedAt`). */
  noticeStorageKey: 'canivete:cookie-notice',
} as const

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
