import { describe, expect, it } from 'vitest'
import { between, exitTime, formatClock, formatSpan, optionalHolidays, parseClock, parseSpan, sumEntries, toDecimalHours, workHoursBetween } from '@/modules/hours/lib/hours'

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

describe('workHoursBetween', () => {
  const eight = { weekdayMinutes: 480 }

  it('conta as duas pontas: de segunda a sexta são 40 horas', () => {
    expect(workHoursBetween('2026-10-05', '2026-10-09', eight)).toEqual({ minutes: 2400, workdays: 5, daysOff: [] })
  })

  it('tira o feriado nacional que cai em dia útil e diz qual foi', () => {
    // 12/10/2026 é segunda, Nossa Senhora Aparecida.
    expect(workHoursBetween('2026-10-12', '2026-10-16', eight)).toEqual({ minutes: 1920, workdays: 4, daysOff: [{ date: '2026-10-12', name: 'Nossa Senhora Aparecida' }] })
  })

  it('aceita as datas trocadas e um dia só', () => {
    expect(workHoursBetween('2026-10-16', '2026-10-12', eight).minutes).toBe(1920)
    expect(workHoursBetween('2026-10-13', '2026-10-13', eight).minutes).toBe(480)
    expect(workHoursBetween('2026-10-18', '2026-10-18', eight).workdays).toBe(0)
  })

  it('conta o sábado só quando tem horas', () => {
    expect(workHoursBetween('2026-10-13', '2026-10-18', eight).minutes).toBe(1920)
    expect(workHoursBetween('2026-10-13', '2026-10-18', { weekdayMinutes: 480, saturdayMinutes: 240 })).toMatchObject({ minutes: 2160, workdays: 5 })
  })

  it('folga no Carnaval e em Corpus Christi só quando pedido', () => {
    // Carnaval de 2026: 16 e 17 de fevereiro; Corpus Christi: 4 de junho.
    expect(optionalHolidays(2026)).toEqual(new Map([['2026-02-16', 'Carnaval'], ['2026-02-17', 'Carnaval'], ['2026-06-04', 'Corpus Christi']]))
    expect(workHoursBetween('2026-02-16', '2026-02-20', eight).minutes).toBe(2400)
    expect(workHoursBetween('2026-02-16', '2026-02-20', { ...eight, optionalDaysOff: true }).workdays).toBe(3)
  })

  it('tira as folgas extras, sem contar duas vezes o que já é feriado', () => {
    const result = workHoursBetween('2026-10-12', '2026-10-16', { ...eight, extraDaysOff: ['2026-10-12', '2026-10-15', '2026-10-17'] })
    expect(result.workdays).toBe(3)
    expect(result.daysOff).toEqual([
      { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
      { date: '2026-10-15', name: 'Folga' },
    ])
  })

  it('passa de um ano para o outro', () => {
    // 31/12/2026 (quinta) conta; 01/01/2027 (sexta) é feriado.
    expect(workHoursBetween('2026-12-31', '2027-01-01', eight)).toMatchObject({ minutes: 480, workdays: 1 })
  })
})
