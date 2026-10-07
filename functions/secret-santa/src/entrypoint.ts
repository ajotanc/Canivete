import { HEADERS } from './config.js'
import { handleAction } from './handler.js'
import { SantaError } from './lib/errors.js'
import type { SantaDb } from './types.js'

/** Parte do contexto da Appwrite Function que usamos. */
export interface FunctionContext {
  req: { method: string; headers?: Record<string, string | undefined>; bodyJson?: unknown; bodyText?: string }
  res: { json(body: unknown, status?: number): unknown }
  error(message: string): void
}

/** Monta a função exportada pela Appwrite, recebendo uma fábrica do banco (injetável nos testes). */
export function createEntrypoint(getDb: (context: FunctionContext) => SantaDb) {
  return async (context: FunctionContext): Promise<unknown> => {
    const { req, res, error } = context
    if (req.method !== 'POST') {
      return res.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Use o método POST.' } }, 405)
    }

    let body: unknown = req.bodyJson
    if (body === undefined || body === '') {
      try {
        body = JSON.parse(req.bodyText || '{}')
      } catch {
        return res.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'O corpo precisa ser JSON.' } }, 400)
      }
    }

    try {
      const data = await handleAction(getDb(context), body, { userId: req.headers?.[HEADERS.userId] || null })
      return res.json({ ok: true, data })
    } catch (caught) {
      if (caught instanceof SantaError) {
        return res.json({ ok: false, error: { code: caught.code, message: caught.message, details: caught.details } }, caught.status)
      }
      error(String(caught))
      return res.json(
        { ok: false, error: { code: 'INTERNAL', message: 'Algo deu errado. Tente novamente em instantes.' } },
        500,
      )
    }
  }
}
