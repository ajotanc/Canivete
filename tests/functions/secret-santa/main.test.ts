import { describe, expect, it } from 'vitest'
import { createEntrypoint, type FunctionContext } from '../../../functions/secret-santa/src/entrypoint'
import { createFakeDb } from './fakeDb'

function makeContext(overrides: Partial<FunctionContext['req']>) {
  const calls: { body: unknown; status?: number }[] = []
  const errors: string[] = []
  const context: FunctionContext = {
    req: { method: 'POST', ...overrides },
    res: {
      json(body, status) {
        calls.push({ body, status })
        return body
      },
    },
    error: (message) => errors.push(message),
  }
  return { context, calls, errors }
}

describe('entrypoint', () => {
  const run = createEntrypoint(() => createFakeDb())

  it('responde ok com os dados da ação', async () => {
    const { context, calls } = makeContext({ bodyJson: { action: 'createGroup', name: 'Turma' } })
    await run(context)
    expect(calls[0].status).toBeUndefined()
    expect(calls[0].body).toMatchObject({ ok: true, data: { groupId: expect.any(String), adminToken: expect.any(String) } })
  })

  it('lê o corpo de bodyText quando bodyJson não vem', async () => {
    const { context, calls } = makeContext({ bodyText: JSON.stringify({ action: 'createGroup', name: 'Turma' }) })
    await run(context)
    expect(calls[0].body).toMatchObject({ ok: true })
  })

  it('devolve erros esperados com código, mensagem em português e status', async () => {
    const { context, calls } = makeContext({ bodyJson: { action: 'getGroup', groupId: 'naoexiste' } })
    await run(context)
    expect(calls[0].status).toBe(404)
    expect(calls[0].body).toEqual({ ok: false, error: { code: 'GROUP_NOT_FOUND', message: 'Grupo não encontrado.' } })
  })

  it('recusa métodos diferentes de POST', async () => {
    const { context, calls } = makeContext({ method: 'GET' })
    await run(context)
    expect(calls[0].status).toBe(405)
  })

  it('recusa corpo que não é JSON', async () => {
    const { context, calls } = makeContext({ bodyText: '{ quebrado' })
    await run(context)
    expect(calls[0].status).toBe(400)
    expect((calls[0].body as { error: { code: string } }).error.code).toBe('INVALID_INPUT')
  })

  it('erro inesperado vira INTERNAL, sem vazar detalhes, e é registrado', async () => {
    const broken = createEntrypoint(() => {
      throw new Error('chave secreta no erro')
    })
    const { context, calls, errors } = makeContext({ bodyJson: { action: 'getGroup', groupId: 'abc' } })
    await broken(context)
    expect(calls[0].status).toBe(500)
    expect(JSON.stringify(calls[0].body)).not.toContain('chave secreta')
    expect(errors[0]).toContain('chave secreta')
  })
})
