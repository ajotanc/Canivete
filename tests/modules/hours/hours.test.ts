import { describe, expect, it } from 'vitest'
import { between, exitTime, formatClock, formatSpan, parseClock, parseSpan, sumEntries, toDecimalHours } from '@/modules/hours/lib/hours'

describe('parseClock', () => {
  it('lê horas de 00:00 a 23:59', () => {
    expect(parseClock('00:00')).toBe(0)
    expect(parseClock('08:30')).toBe(510)
    expect(parseClock('8:30')).toBe(510)
    expect(parseClock(' 23:59 ')).toBe(1439)
  })

  it('rejeita o que não é hora', () => {
    for (const text of ['', '24:00', '12:60', '1230', 'ab:cd', '12:5', '-1:00']) expect(parseClock(text)).toBeNull()
  })
})

describe('parseSpan', () => {
  it('lê durações longas', () => {
    expect(parseSpan('8:30')).toBe(510)
    expect(parseSpan('120:30')).toBe(7230)
    expect(parseSpan('0:45')).toBe(45)
  })

  it('rejeita minutos acima de 59 e formatos errados', () => {
    for (const text of ['1:60', '1000:00', '', 'x', '1:5']) expect(parseSpan(text)).toBeNull()
  })
})

describe('formatação', () => {
  it('formata durações com sinal', () => {
    expect(formatSpan(510)).toBe('8:30')
    expect(formatSpan(0)).toBe('0:00')
    expect(formatSpan(-75)).toBe('-1:15')
    expect(formatSpan(7230)).toBe('120:30')
  })

  it('formata o relógio dando a volta no dia', () => {
    expect(formatClock(510)).toBe('08:30')
    expect(formatClock(1440 + 30)).toBe('00:30')
    expect(formatClock(-30)).toBe('23:30')
  })

  it('converte para horas decimais', () => {
    expect(toDecimalHours(510)).toBe(8.5)
    expect(toDecimalHours(20)).toBe(0.33)
    expect(toDecimalHours(0)).toBe(0)
  })
})

describe('between', () => {
  it('calcula o tempo trabalhado descontando o intervalo', () => {
    expect(between(8 * 60, 17 * 60, 60)).toEqual({ minutes: 480, nextDay: false })
  })

  it('fim antes do início vira o dia seguinte', () => {
    expect(between(22 * 60, 6 * 60)).toEqual({ minutes: 480, nextDay: true })
  })

  it('início igual ao fim é zero, e intervalo negativo é ignorado', () => {
    expect(between(600, 600).minutes).toBe(0)
    expect(between(600, 660, -30).minutes).toBe(60)
  })

  it('o intervalo maior que o período dá negativo', () => {
    expect(between(600, 630, 60).minutes).toBe(-30)
  })
})

describe('exitTime', () => {
  it('soma jornada e intervalo à entrada', () => {
    expect(exitTime(8 * 60, 8 * 60, 60)).toEqual({ clock: '17:00', daysLater: 0 })
  })

  it('passando da meia-noite avisa quantos dias depois', () => {
    expect(exitTime(20 * 60, 8 * 60, 60)).toEqual({ clock: '05:00', daysLater: 1 })
  })
})

describe('sumEntries', () => {
  it('soma e subtrai', () => {
    expect(sumEntries([{ sign: 1, minutes: 480 }, { sign: 1, minutes: 90 }, { sign: -1, minutes: 60 }])).toBe(510)
    expect(sumEntries([])).toBe(0)
    expect(sumEntries([{ sign: -1, minutes: 30 }])).toBe(-30)
  })
})
