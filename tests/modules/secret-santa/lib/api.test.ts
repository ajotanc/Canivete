import { describe, expect, it } from 'vitest'
import { AppwriteConfigError } from '@/core/services/appwrite'
import {
  askQuestion,
  postMessage,
  callSanta,
  createGroup,
  revealMatch,
  SantaApiError,
  setupPin,
  type Execute,
} from '@/modules/secret-santa/lib/api'

function respond(body: unknown, status = 200): Execute {
  return async () => ({ responseStatusCode: status, responseBody: JSON.stringify(body) })
}

describe('callSanta', () => {
  it('envia a ação e os parâmetros como JSON e devolve os dados', async () => {
    let sent = ''
    const execute: Execute = async (body) => {
      sent = body
      return { responseStatusCode: 200, responseBody: JSON.stringify({ ok: true, data: { groupId: 'g1' } }) }
    }
    const data = await callSanta<{ groupId: string }>('createGroup', { name: 'Turma' }, execute)
    expect(JSON.parse(sent)).toEqual({ action: 'createGroup', name: 'Turma' })
    expect(data.groupId).toBe('g1')
  })

  it('converte erros da Function em SantaApiError com código e mensagem', async () => {
    const execute = respond({ ok: false, error: { code: 'NAME_TAKEN', message: 'Nome repetido.' } }, 409)
    await expect(callSanta('join', {}, execute)).rejects.toMatchObject({ code: 'NAME_TAKEN', message: 'Nome repetido.' })
    await expect(callSanta('join', {}, execute)).rejects.toBeInstanceOf(SantaApiError)
  })

  it('converte falha de rede em NETWORK', async () => {
    const execute: Execute = async () => {
      throw new Error('offline')
    }
    await expect(callSanta('getGroup', {}, execute)).rejects.toMatchObject({ code: 'NETWORK' })
  })

  it('converte AppwriteConfigError em CONFIG', async () => {
    const execute: Execute = async () => {
      throw new AppwriteConfigError('faltam variáveis')
    }
    await expect(callSanta('getGroup', {}, execute)).rejects.toMatchObject({ code: 'CONFIG' })
  })

  it('converte resposta que não é JSON em NETWORK com mensagem amigável', async () => {
    const execute: Execute = async () => ({ responseStatusCode: 502, responseBody: '<html>erro</html>' })
    const error = (await callSanta('getGroup', {}, execute).catch((e: unknown) => e)) as SantaApiError
    expect(error.code).toBe('NETWORK')
    expect(error.message).toMatch(/servidor/i)
  })
})

describe('funções tipadas', () => {
  it('createGroup envia organizador só quando informado', async () => {
    let sent: Record<string, unknown> = {}
    const execute: Execute = async (body) => {
      sent = JSON.parse(body)
      return { responseStatusCode: 200, responseBody: JSON.stringify({ ok: true, data: { groupId: 'g' } }) }
    }
    await createGroup({ name: 'Turma', budget: null, eventDate: '' }, execute)
    expect(sent.organizer).toBeUndefined()
    await createGroup({ name: 'Turma', organizer: { name: 'Lia', pin: '1234', wishlist: [] } }, execute)
    expect(sent.organizer).toEqual({ name: 'Lia', pin: '1234', wishlist: [] })
  })

  it('revealMatch devolve o par quando sorteado', async () => {
    const execute = respond({
      ok: true,
      data: { status: 'drawn', wishlist: ['x'], receiver: { name: 'Ana', wishlist: ['y'] } },
    })
    const result = await revealMatch({ groupId: 'g', name: 'João', pin: '1234' }, execute)
    expect(result).toEqual({ status: 'drawn', wishlist: ['x'], receiver: { name: 'Ana', wishlist: ['y'] } })
  })

  it('setupPin envia nome, PIN e lista de desejos na ação de primeiro acesso', async () => {
    let sent: Record<string, unknown> = {}
    const execute: Execute = async (body) => {
      sent = JSON.parse(body)
      return { responseStatusCode: 200, responseBody: JSON.stringify({ ok: true, data: {} }) }
    }
    await setupPin({ groupId: 'g', name: 'Ana', pin: '1234', wishlist: [{ text: 'chá', url: 'https://loja.com/cha' }] }, execute)
    expect(sent).toEqual({ action: 'setupPin', groupId: 'g', name: 'Ana', pin: '1234', wishlist: [{ text: 'chá', url: 'https://loja.com/cha' }] })
  })

  it('PIN_ALREADY_SET chega como código próprio', async () => {
    const execute = respond({ ok: false, error: { code: 'PIN_ALREADY_SET', message: 'Já criou.' } }, 409)
    await expect(setupPin({ groupId: 'g', name: 'Ana', pin: '1234' }, execute)).rejects.toMatchObject({
      code: 'PIN_ALREADY_SET',
    })
  })

  it('askQuestion e postMessage mandam as credenciais junto', async () => {
    const sent: Record<string, unknown>[] = []
    const execute: Execute = async (body) => {
      sent.push(JSON.parse(body))
      return { responseStatusCode: 200, responseBody: JSON.stringify({ ok: true, data: {} }) }
    }
    const credentials = { groupId: 'g', name: 'Ana', pin: '1234' }
    await askQuestion({ ...credentials, question: 'Chocolate ou vinho?' }, execute)
    await postMessage({ ...credentials, text: 'Oi' }, execute)
    expect(sent).toEqual([
      { action: 'askQuestion', ...credentials, question: 'Chocolate ou vinho?' },
      { action: 'postMessage', ...credentials, text: 'Oi' },
    ])
  })
})
