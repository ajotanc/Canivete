export type SantaErrorCode =
  | 'INVALID_INPUT'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_CLOSED'
  | 'NAME_TAKEN'
  | 'BAD_CREDENTIALS'
  | 'LOCKED'
  | 'NOT_ENOUGH_PARTICIPANTS'
  | 'FORBIDDEN'
  | 'INTERNAL'

/** Status HTTP de cada código de erro. */
const STATUS: Record<SantaErrorCode, number> = {
  INVALID_INPUT: 400,
  GROUP_NOT_FOUND: 404,
  GROUP_CLOSED: 409,
  NAME_TAKEN: 409,
  BAD_CREDENTIALS: 401,
  LOCKED: 429,
  NOT_ENOUGH_PARTICIPANTS: 422,
  FORBIDDEN: 403,
  INTERNAL: 500,
}

/** Erro esperado da Function; a mensagem já vem em português e pode ser mostrada à pessoa. */
export class SantaError extends Error {
  readonly status: number

  constructor(
    public readonly code: SantaErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SantaError'
    this.status = STATUS[code]
  }
}
