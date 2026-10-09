import { describe, expect, it, vi } from 'vitest'
import { daysUntil, loadHolidays, nextHoliday, offlineHolidays } from '@/modules/holidays/lib/holidays'

const json = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch

describe('loadHolidays', () => {
  it('usa a resposta online, ordenada por data', async () => {
    const fetcher = json([
      { date: '2026-04-21', name: 'Tiradentes', type: 'national' },
      { date: '2026-01-01', name: 'Confraternização mundial', type: 'national' },
    ])
    const list = await loadHolidays(2026, fetcher)
    expect(list.live).toBe(true)
    expect(list.holidays.map((h) => h.date)).toEqual(['2026-01-01', '2026-04-21'])
    expect(fetcher).toHaveBeenCalledWith('https://brasilapi.com.br/api/feriados/v1/2026')
  })

  it('cai nos feriados calculados quando a consulta falha', async () => {
    const list = await loadHolidays(2026, json({}, false))
    expect(list.live).toBe(false)
    expect(list.holidays).toEqual(offlineHolidays(2026))
  })

  it('cai nos calculados quando a rede quebra ou a lista vem vazia', async () => {
    expect((await loadHolidays(2026, vi.fn().mockRejectedValue(new Error('rede')) as unknown as typeof fetch)).live).toBe(false)
    expect((await loadHolidays(2026, json([]))).live).toBe(false)
  })
})

describe('datas', () => {
  it('conta os dias até o feriado', () => {
    expect(daysUntil('2026-09-07', '2026-09-05')).toBe(2)
    expect(daysUntil('2026-09-07', '2026-09-08')).toBe(-1)
  })

  it('acha o próximo feriado, inclusive hoje', () => {
    const list = offlineHolidays(2026)
    expect(nextHoliday(list, '2026-09-07')?.name).toBe('Independência do Brasil')
    expect(nextHoliday(list, '2026-12-26')).toBeUndefined()
  })
})
