import { describe, expect, it } from 'vitest'
import { getLocalTimeZone, today } from '@internationalized/date'
import { dateValueToIso, eventYearRange, formatDateNumeric, formatDateValue, isoToDateValue } from '@/lib/date'
import { DATE_PICKER } from '@/core/config'

describe('isoToDateValue e dateValueToIso', () => {
  it('convertem nos dois sentidos', () => {
    const value = isoToDateValue('2026-12-24')
    expect(value).toMatchObject({ year: 2026, month: 12, day: 24 })
    expect(dateValueToIso(value)).toBe('2026-12-24')
  })

  it('vazio, inválido e data desmarcada viram vazio', () => {
    expect(isoToDateValue('')).toBeUndefined()
    expect(isoToDateValue('lixo')).toBeUndefined()
    expect(isoToDateValue('2026-02-31')).toBeUndefined()
    expect(dateValueToIso(undefined)).toBe('')
  })
})

describe('formatDateValue', () => {
  it('escreve a data por extenso em português', () => {
    expect(formatDateValue(isoToDateValue('2026-12-24')!)).toBe('24 de dezembro de 2026')
  })
})

describe('eventYearRange', () => {
  const thisYear = today(getLocalTimeZone()).year
  const years = (selected?: string) => eventYearRange(selected ? isoToDateValue(selected) : undefined).map((d) => d.year)

  it('vai do ano atual até alguns anos à frente, sem décadas para trás', () => {
    expect(years()).toEqual(Array.from({ length: DATE_PICKER.yearsAhead + 1 }, (_, i) => thisYear + i))
  })

  it('amplia a faixa quando a data salva está fora dela', () => {
    expect(years(`${thisYear - 3}-12-24`)[0]).toBe(thisYear - 3)
    expect(years(`${thisYear + 6}-12-24`).at(-1)).toBe(thisYear + 6)
  })

  it('mantém a faixa quando a data salva está dentro dela', () => {
    expect(years(`${thisYear + 1}-06-01`)).toEqual(years())
  })
})

describe('formatDateNumeric', () => {
  it('formata como dd/mm/aaaa, com zero à esquerda', () => {
    expect(formatDateNumeric(isoToDateValue('2026-03-05')!)).toBe('05/03/2026')
    expect(formatDateNumeric(isoToDateValue('2026-12-24')!)).toBe('24/12/2026')
  })
})
