import { describe, expect, it, vi } from 'vitest'
import { addressLine, cepDigits, formatCep, lookupCep, searchStreet } from '@/modules/cep/lib/cep'

const json = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch

const item = { cep: '01310-100', logradouro: 'Avenida Paulista', complemento: 'de 612 a 1510 - lado par', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP', ibge: '3550308', ddd: '11' }

describe('formatação', () => {
  it('extrai os dígitos e limita a 8', () => {
    expect(cepDigits('01310-100x9')).toBe('01310100')
  })

  it('põe o traço só no CEP completo', () => {
    expect(formatCep('01310100')).toBe('01310-100')
    expect(formatCep('0131')).toBe('0131')
  })
})

describe('lookupCep', () => {
  it('converte a resposta em endereço', async () => {
    const fetcher = json(item)
    const address = await lookupCep('01310100', fetcher)
    expect(address).toMatchObject({ cep: '01310-100', street: 'Avenida Paulista', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', ibge: '3550308', ddd: '11' })
    expect(fetcher).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/')
  })

  it('devolve null quando o CEP não existe', async () => {
    expect(await lookupCep('99999999', json({ erro: true }))).toBeNull()
  })

  it('rejeita CEP incompleto sem consultar', async () => {
    const fetcher = json(item)
    await expect(lookupCep('0131', fetcher)).rejects.toThrow('8 números')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('lança erro quando a consulta falha', async () => {
    await expect(lookupCep('01310100', json({}, false))).rejects.toThrow('falhou')
  })
})

describe('searchStreet', () => {
  it('monta a URL com os termos codificados e devolve a lista', async () => {
    const fetcher = json([item, { erro: true }])
    const list = await searchStreet('sp', 'São Paulo', 'Av Paulista', fetcher)
    expect(list).toHaveLength(1)
    expect(fetcher).toHaveBeenCalledWith('https://viacep.com.br/ws/SP/S%C3%A3o%20Paulo/Av%20Paulista/json/')
  })

  it('valida estado, cidade e rua', async () => {
    await expect(searchStreet('S', 'São Paulo', 'Paulista')).rejects.toThrow('estado')
    await expect(searchStreet('SP', '', 'Paulista')).rejects.toThrow('cidade')
    await expect(searchStreet('SP', 'São Paulo', 'Av')).rejects.toThrow('3 letras')
  })
})

describe('addressLine', () => {
  it('junta o endereço em uma linha', () => {
    expect(addressLine({ cep: '01310-100', street: 'Avenida Paulista', complement: '', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', ibge: '', ddd: '' })).toBe(
      'Avenida Paulista, Bela Vista, São Paulo - SP, CEP 01310-100',
    )
  })
})
