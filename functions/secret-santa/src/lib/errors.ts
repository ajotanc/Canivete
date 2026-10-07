export type SantaErrorCode =
  | 'INVALID_INPUT'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_CLOSED'
  | 'NAME_TAKEN'
  | 'PIN_NOT_SET'
  | 'PIN_ALREADY_SET'
  | 'BAD_CREDENTIALS'
  | 'LOCKED'
  | 'NOT_ENOUGH_PARTICIPANTS'
  | 'DRAW_IMPOSSIBLE'
  | 'FORBIDDEN'
  | 'INTERNAL'

/** Status HTTP de cada código de erro. */
const STATUS: Record<SantaErrorCode, number> = {
  INVALID_INPUT: 400,
  GROUP_NOT_FOUND: 404,
  GROUP_CLOSED: 409,
  NAME_TAKEN: 409,
  PIN_NOT_SET: 409,
  PIN_ALREADY_SET: 409,
  BAD_CREDENTIALS: 401,
  LOCKED: 429,
  NOT_ENOUGH_PARTICIPANTS: 422,
  DRAW_IMPOSSIBLE: 422,
  FORBIDDEN: 403,
  INTERNAL: 500,
}

/** Erro esperado da Function; a mensagem já vem em português e pode ser mostrada à pessoa. */
export class SantaError extends Error {
  readonly status: number

  constructor(
    public readonly code: SantaErrorCode,
    message: string,
    /** Dados extras para a tela (ex.: sugestões de endereço). */
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'SantaError'
    this.status = STATUS[code]
  }
}
