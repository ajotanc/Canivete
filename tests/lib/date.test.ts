import { describe, expect, it } from 'vitest'
import { dateValueToIso, formatDateNumeric, isoToDateValue, isoToNumeric, numericToIso } from '@/lib/date'

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

describe('formatDateNumeric', () => {
  it('formata como dd/mm/aaaa, com zero à esquerda', () => {
    expect(formatDateNumeric(isoToDateValue('2026-03-05')!)).toBe('05/03/2026')
    expect(formatDateNumeric(isoToDateValue('2026-12-24')!)).toBe('24/12/2026')
  })
})

describe('isoToNumeric e numericToIso', () => {
  it('convertem nos dois sentidos', () => {
    expect(isoToNumeric('2026-03-05')).toBe('05/03/2026')
    expect(numericToIso('05/03/2026')).toBe('2026-03-05')
    expect(isoToNumeric('')).toBe('')
    expect(isoToNumeric('lixo')).toBe('')
  })

  it('texto incompleto, com formato errado ou com dia que não existe devolve null', () => {
    expect(numericToIso('')).toBeNull()
    expect(numericToIso('05/03/20')).toBeNull()
    expect(numericToIso('2026-03-05')).toBeNull()
    expect(numericToIso('31/02/2026')).toBeNull()
    expect(numericToIso('00/10/2026')).toBeNull()
    expect(numericToIso('10/13/2026')).toBeNull()
    expect(numericToIso('10/10/0026')).toBeNull()
  })

  it('aceita 29/02 só em ano bissexto', () => {
    expect(numericToIso('29/02/2028')).toBe('2028-02-29')
    expect(numericToIso('29/02/2026')).toBeNull()
  })
})
