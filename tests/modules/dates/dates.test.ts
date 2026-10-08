import { describe, expect, it } from 'vitest'
import {
  addBusinessDays,
  addDays,
  ageOn,
  businessDaysBetween,
  daysBetween,
  describeSpan,
  easter,
  holidayName,
  isBusinessDay,
  isValidIso,
  nationalHolidays,
  spanBetween,
  todayIso,
  weekdayName,
} from '@/modules/dates/lib/dates'

describe('datas básicas', () => {
  it('valida datas reais', () => {
    expect(isValidIso('2026-02-28')).toBe(true)
    expect(isValidIso('2026-02-30')).toBe(false)
    expect(isValidIso('2026-2-3')).toBe(false)
    expect(isValidIso('')).toBe(false)
  })

  it('soma dias atravessando mês e ano', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('conta dias entre datas, com sinal', () => {
    expect(daysBetween('2026-01-01', '2026-12-25')).toBe(358)
    expect(daysBetween('2026-12-25', '2026-01-01')).toBe(-358)
  })

  it('nomeia o dia da semana', () => {
    expect(weekdayName('2026-12-25')).toBe('sexta-feira')
  })

  it('pega hoje no fuso do aparelho', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('feriados', () => {
  it('calcula a Páscoa', () => {
    expect(easter(2024)).toBe('2024-03-31')
    expect(easter(2025)).toBe('2025-04-20')
    expect(easter(2026)).toBe('2026-04-05')
  })

  it('inclui Sexta-feira Santa e os feriados fixos', () => {
    const holidays = nationalHolidays(2026)
    expect(holidays.get('2026-04-03')).toBe('Sexta-feira Santa')
    expect(holidays.get('2026-09-07')).toBe('Independência do Brasil')
    expect(holidays.size).toBe(10)
    expect(holidayName('2026-12-25')).toBe('Natal')
    expect(holidayName('2026-12-26')).toBeUndefined()
  })

  it('fim de semana e feriado não são dias úteis', () => {
    expect(isBusinessDay('2026-12-25')).toBe(false)
    expect(isBusinessDay('2026-12-26')).toBe(false)
    expect(isBusinessDay('2026-12-28')).toBe(true)
  })
})

describe('dias úteis', () => {
  it('soma pulando fim de semana e feriado', () => {
    // sexta 18/12 + 5 úteis: 21, 22, 23, 24, (25 Natal) 28
    expect(addBusinessDays('2026-12-18', 5)).toBe('2026-12-28')
  })

  it('subtrai dias úteis', () => {
    expect(addBusinessDays('2026-12-28', -1)).toBe('2026-12-24')
  })

  it('zero dias devolve a mesma data', () => {
    expect(addBusinessDays('2026-12-26', 0)).toBe('2026-12-26')
  })

  it('conta dias úteis entre datas', () => {
    expect(businessDaysBetween('2026-12-21', '2026-12-28')).toBe(4)
    expect(businessDaysBetween('2026-12-28', '2026-12-21')).toBe(4)
  })
})

describe('período e idade', () => {
  it('calcula anos, meses e dias', () => {
    expect(spanBetween('2020-01-31', '2026-03-01')).toEqual({ years: 6, months: 1, days: 1 })
    expect(spanBetween('2026-03-01', '2020-01-31')).toEqual({ years: 6, months: 1, days: 1 })
    expect(spanBetween('2026-05-10', '2026-05-10')).toEqual({ years: 0, months: 0, days: 0 })
  })

  it('calcula a idade e os dias até o aniversário', () => {
    const age = ageOn('1990-06-15', '2026-06-10')
    expect(age).toMatchObject({ years: 35, months: 11, days: 26, daysToBirthday: 5 })
  })

  it('no dia do aniversário faltam 0 dias', () => {
    expect(ageOn('1990-06-15', '2026-06-15')).toMatchObject({ years: 36, months: 0, days: 0, daysToBirthday: 0 })
  })

  it('quem nasceu em 29/02 comemora em 01/03 nos anos comuns', () => {
    expect(ageOn('2000-02-29', '2026-02-20').daysToBirthday).toBe(9)
  })

  it('descreve o período em português', () => {
    expect(describeSpan({ years: 1, months: 2, days: 3 })).toBe('1 ano, 2 meses e 3 dias')
    expect(describeSpan({ years: 0, months: 1, days: 0 })).toBe('1 mês')
    expect(describeSpan({ years: 0, months: 0, days: 0 })).toBe('0 dias')
  })
})
