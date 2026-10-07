/** Constantes do módulo sorteador de nomes: limites da lista, animação e formato do id do registro. */

export const MAX_NAMES = 1000
export const MAX_NAME_LENGTH = 100

/** Animação do sorteio: duração padrão e de quanto em quanto tempo os nomes embaralhados trocam. */
export const DRAW_ANIMATION = { durationMs: 2000, shuffleIntervalMs: 80 } as const

/** Ids de linha aceitos pelo Appwrite: até 36 caracteres, sem caractere especial no início. */
export const ROW_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/
