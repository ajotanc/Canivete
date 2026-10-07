import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { eventCountdown, formatEventDate } from '@/modules/secret-santa/lib/event'

describe('formatEventDate', () => {
  it('escreve a data por extenso em português', () => {
    expect(formatEventDate('2026-12-24')).toBe('24 de dezembro de 2026')
  })
})

describe('eventCountdown', () => {
  const today = dayjs('2026-10-07T15:30:00')

  it('conta os dias quando faltam mais de um', () => {
    expect(eventCountdown('2026-12-24', today)).toBe('Troca em 78 dias')
  })

  it('diz "amanhã" quando falta um dia', () => {
    expect(eventCountdown('2026-10-08', today)).toBe('Troca amanhã')
  })

  it('avisa quando a troca é hoje, qualquer que seja a hora', () => {
    expect(eventCountdown('2026-10-07', today)).toBe('A troca é hoje')
  })

  it('volta ao texto neutro quando a data já passou', () => {
    expect(eventCountdown('2026-10-01', today)).toBe('Data da troca')
  })
})
