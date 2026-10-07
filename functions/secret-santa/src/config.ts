/**
 * Configuração central da Function: nomes de variáveis de ambiente, tabelas, cabeçalhos, limites e regras.
 * Todo número ou texto que muda o comportamento do amigo secreto mora aqui, para ajustar num lugar só.
 *
 * Os limites de texto também existem no site (`src/modules/secret-santa/constants.ts`); um teste
 * (`tests/modules/secret-santa/constants.test.ts`) confere que os dois arquivos continuam iguais.
 */

export type Env = Record<string, string | undefined>

/** Variáveis de ambiente. Listas valem em ordem: a primeira definida ganha (as `APPWRITE_FUNCTION_*` são injetadas pela Appwrite). */
export const ENV = {
  endpoint: ['APPWRITE_ENDPOINT', 'APPWRITE_FUNCTION_API_ENDPOINT'],
  projectId: ['APPWRITE_PROJECT_ID', 'APPWRITE_FUNCTION_PROJECT_ID'],
  apiKey: ['APPWRITE_API_KEY'],
  databaseId: ['SANTA_DATABASE_ID'],
} as const

/** Tabelas: variável que sobrescreve o id e o id usado quando ela não existe. */
export const TABLES = {
  groups: { envVar: 'SANTA_GROUPS_TABLE_ID', fallback: 'santa_groups' },
  participants: { envVar: 'SANTA_PARTICIPANTS_TABLE_ID', fallback: 'santa_participants' },
  questions: { envVar: 'SANTA_QUESTIONS_TABLE_ID', fallback: 'santa_questions' },
  posts: { envVar: 'SANTA_POSTS_TABLE_ID', fallback: 'santa_posts' },
} as const

/** Cabeçalhos que a Appwrite manda em cada execução. */
export const HEADERS = {
  /** Chave temporária da execução, usada quando `APPWRITE_API_KEY` não está definida. */
  apiKey: 'x-appwrite-key',
  /** Id da conta logada que fez a chamada (vazio para convidados). */
  userId: 'x-appwrite-user-id',
} as const

/** Limites de texto e de quantidade. */
export const LIMITS = {
  groupName: 80,
  personName: 60,
  wishlistItems: 10,
  wishlistText: 100,
  wishlistUrl: 500,
  question: 200,
  answer: 300,
  post: 300,
  questionsPerPerson: 10,
  /** Valor sugerido máximo, em reais. */
  budget: 1_000_000,
  slugMin: 3,
  slugMax: 40,
  participants: 100,
  /** Regras de "quem não pode se tirar" por grupo. */
  exclusions: 50,
} as const

/** Bloqueio por PIN errado: depois de `afterFailures` erros seguidos, a pessoa espera `minutes`. */
export const LOCK = { afterFailures: 5, minutes: 15 } as const

/** Código curto do grupo, usado como id na URL. Sem letras e números que se confundem (0/o, 1/l/i). */
export const GROUP_CODE = {
  alphabet: 'abcdefghjkmnpqrstuvwxyz23456789',
  length: 6,
  /** Tentativas de achar um código livre antes de desistir. */
  maxAttempts: 5,
} as const

export const DRAW = {
  minParticipants: 3,
  /** Rodadas de embaralhamento até achar uma roda que respeite as regras de exclusão. */
  maxAttempts: 500,
} as const

/** Tamanhos de página e lotes das consultas ao banco. */
export const QUERY = {
  /** Grupos listados por conta. */
  groupsPerOwner: 50,
  /** Linhas por consulta (participantes, perguntas e recados). */
  rows: 100,
  /** Lotes de exclusão ao apagar um grupo (cada lote tem até `rows` linhas). */
  deleteBatches: 100,
} as const

/** Cores do grupo; sem escolha vale a padrão. Cor livre #RRGGBB precisa de contraste com texto branco. */
export const GROUP_COLORS = ['berry', 'cobalt', 'pine', 'violet', 'amber'] as const
export type GroupColor = (typeof GROUP_COLORS)[number]
export const DEFAULT_GROUP_COLOR: GroupColor = 'berry'
export const COLOR_LUMINANCE = { max: 0.3, min: 0.02 } as const

/** Nomes que são rotas do grupo (`/g/:id/me`, `/g/:id/admin`) e não podem ser texto de link. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set(['me', 'admin'])

/** Separa o texto do link dentro de um item da lista de desejos (a coluna guarda um valor só por item). */
export const WISH_SEPARATOR = String.fromCharCode(9)

const firstDefined = (env: Env, names: readonly string[]) => names.map((name) => env[name]).find(Boolean)

/** Lê a configuração: variáveis da Function, com as que a Appwrite injeta como alternativa. */
export function readConfig(env: Env) {
  const endpoint = firstDefined(env, ENV.endpoint)
  const projectId = firstDefined(env, ENV.projectId)
  const apiKey = firstDefined(env, ENV.apiKey)
  const databaseId = firstDefined(env, ENV.databaseId)
  if (!endpoint || !projectId || !apiKey || !databaseId) {
    const needed = [ENV.endpoint[0], ENV.projectId[0], ENV.apiKey[0], ENV.databaseId[0]]
    throw new Error(`Faltam variáveis: ${needed.join(', ')}.`)
  }
  const table = (key: keyof typeof TABLES) => env[TABLES[key].envVar] || TABLES[key].fallback
  return {
    endpoint,
    projectId,
    apiKey,
    databaseId,
    groupsTableId: table('groups'),
    participantsTableId: table('participants'),
    questionsTableId: table('questions'),
    postsTableId: table('posts'),
  }
}
