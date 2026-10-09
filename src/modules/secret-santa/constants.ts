/**
 * Constantes do módulo amigo secreto: limites, tempos, chaves e textos que mudam o comportamento da tela.
 * Ajuste aqui, em vez de espalhar números pelos componentes.
 *
 * Os limites de `LIMITS` espelham os da Function (`functions/secret-santa/src/config.ts`), que é quem
 * decide de verdade. Um teste (`tests/modules/secret-santa/constants.test.ts`) confere que os dois
 * arquivos continuam iguais.
 */

/** Limites de texto e quantidade; usados como `maxlength` dos campos e nas regras de tela. */
export const LIMITS = {
  groupName: 80,
  personName: 60,
  wishlistItems: 10,
  wishlistText: 100,
  wishlistUrl: 500,
  question: 200,
  answer: 300,
  post: 300,
  slugMin: 3,
  slugMax: 40,
  /** Imagem de capa já convertida para WebP, em bytes (igual à Function). */
  coverBytes: 1_500_000,
  /** Só da tela: tamanho máximo do texto digitado no campo de valor ("R$ 1.000.000,00"). */
  budgetInput: 20,
} as const

/** Pessoas necessárias para sortear (igual a `DRAW.minParticipants` da Function). */
export const MIN_PARTICIPANTS_TO_DRAW = 3

/** O PIN da interface tem sempre esta quantidade de dígitos; a Function ainda aceita 4 a 6 de PINs antigos. */
export const PIN_LENGTH = 4

/** Nomes que são rotas do grupo (`/g/:id/me`, `/g/:id/admin`) e não servem de texto de link. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set(['me', 'admin'])

/** Cores do grupo; sem escolha vale a padrão. Cor livre precisa de contraste com texto branco. */
export const GROUP_COLORS = ['berry', 'cobalt', 'pine', 'violet', 'amber'] as const
export type GroupColor = (typeof GROUP_COLORS)[number]
export const DEFAULT_GROUP_COLOR: GroupColor = 'berry'
export const COLOR_LUMINANCE = { max: 0.3, min: 0.02 } as const

/** Passos do formulário de criação do grupo. */
export const CREATE_STEP_TITLES = ['Como vai se chamar o grupo?', 'Valor e data (opcionais)', 'Você também participa?'] as const

/** A lista de nomes do convite ganha busca a partir desta quantidade de pessoas. */
export const NAME_SEARCH_FROM = 8

/** Tempos, em milissegundos. */
export const TIMING = {
  /** O nome revelado some sozinho depois disto. */
  revealAutoHideMs: 15_000,
  /** Intervalo mínimo entre duas atualizações ao voltar para a aba. */
  refreshMinGapMs: 8_000,
} as const

/** Chuva de confetes ao abrir a carta. */
export const CONFETTI = {
  colors: ['#C2255C', '#FF7AA2', '#F2B600', '#2457F5', '#FFFFFF'],
  durationMs: 3_500,
} as const

/** Chaves do navegador. O PIN fica só na sessão da aba, nunca no `localStorage`. */
export const STORAGE = {
  credentialsPrefix: 'santa:cred:',
} as const

export const MESSAGES = {
  network: 'Não foi possível falar com o servidor. Tente novamente em instantes.',
  unsavedChanges: 'Você tem alterações que ainda não foram salvas. Sair mesmo assim?',
} as const
