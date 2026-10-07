/** Constantes do gerador de CPF e CNPJ: tipos, quantidades e regras de cálculo dos dígitos verificadores. */

export type DocumentType = 'cpf' | 'cnpj' | 'cnpj-alfa'

export interface DocumentTypeOption {
  value: DocumentType
  label: string
  /** Plural, para "5 CNPJs alfanuméricos gerados". */
  plural: string
  description: string
}

export const DOCUMENT_TYPES: readonly DocumentTypeOption[] = [
  { value: 'cpf', label: 'CPF', plural: 'CPFs', description: 'Pessoa física, 11 dígitos' },
  { value: 'cnpj', label: 'CNPJ', plural: 'CNPJs', description: 'Empresa, 14 dígitos numéricos' },
  { value: 'cnpj-alfa', label: 'CNPJ alfanumérico', plural: 'CNPJs alfanuméricos', description: 'Novo formato, com letras e números' },
]

/** Quantos documentos dá para gerar de uma vez. */
export const QUANTITIES = [1, 5, 10] as const

/** Quanto tempo o botão de copiar mostra o "copiado", em milissegundos. */
export const COPIED_FEEDBACK_MS = 1_600

export const DIGITS = '0123456789'
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
/** Caracteres aceitos nas 12 primeiras posições do CNPJ alfanumérico. */
export const CNPJ_ALPHABET = DIGITS + LETTERS

/** Ordem do estabelecimento: 0001 é a matriz. */
export const CNPJ_BRANCH = '0001'
/** Caracteres sorteados da raiz do CNPJ (as 8 primeiras posições). */
export const CNPJ_ROOT_LENGTH = 8
export const CPF_BASE_LENGTH = 9

/** Pesos do módulo 11 para cada dígito verificador. */
export const CPF_WEIGHTS_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2] as const
export const CPF_WEIGHTS_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const
export const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const
export const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const
