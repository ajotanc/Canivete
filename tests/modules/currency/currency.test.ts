import { describe, expect, it, vi } from 'vitest'
import { convert, formatAmount, loadQuotes, rate } from '@/modules/currency/lib/currency'

const json = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch
const quotes = { brl: { BRL: 1, USD: 5, EUR: 6 }, at: 0 }

describe('conversão', () => {
  it('passa pelo real', () => {
    expect(convert(quotes, 10, 'USD', 'BRL')).toBe(50)
    expect(convert(quotes, 10, 'BRL', 'USD')).toBe(2)
    expect(rate(quotes, 'EUR', 'USD')).toBeCloseTo(1.2)
  })

  it('devolve null sem cotação', () => {
    expect(convert(quotes, 10, 'USD', 'JPY')).toBeNull()
  })

  it('formata o bitcoin com o símbolo', () => {
    expect(formatAmount(0.5, 'BTC')).toBe('₿ 0,5')
  })
})

describe('loadQuotes', () => {
  it('lê o campo bid de cada par', async () => {
    const fetcher = json({ USDBRL: { bid: '5.2', timestamp: '1700000000' }, EURBRL: { bid: '6.1', timestamp: '1700000100' } })
    const result = await loadQuotes(fetcher)
    expect(result.brl).toMatchObject({ BRL: 1, USD: 5.2, EUR: 6.1 })
    expect(result.at).toBe(1700000100000)
  })

  it('falha se a API errar ou vier sem cotação', async () => {
    await expect(loadQuotes(json({}, false))).rejects.toThrow()
    await expect(loadQuotes(json({}))).rejects.toThrow()
  })
})
