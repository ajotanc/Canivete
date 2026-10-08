import { DateFormatter, getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date'
import { createYearRange } from 'reka-ui/date'
import { DATE_PICKER } from '@/core/config'

/** O Calendar do shadcn trabalha com `DateValue`; o app guarda a data como texto ISO (AAAA-MM-DD, ou vazio). */

const longDate = new DateFormatter('pt-BR', { dateStyle: 'long' })

/** "2026-12-24" vira uma data do calendário; vazio ou texto inválido vira `undefined`. */
export function isoToDateValue(iso: string): DateValue | undefined {
  try {
    return iso ? parseDate(iso) : undefined
  } catch {
    return undefined
  }
}

/** Data do calendário de volta para "AAAA-MM-DD"; `undefined` (data desmarcada) vira vazio. */
export const dateValueToIso = (value: DateValue | undefined): string => (value ? value.toString() : '')

/** "24 de dezembro de 2026". */
export const formatDateValue = (value: DateValue): string => longDate.format(value.toDate(getLocalTimeZone()))

/** "24/12/2026". */
export const formatDateNumeric = (value: DateValue): string => `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${value.year}`

/**
 * Anos oferecidos no seletor de ano do calendário: do atual até daqui a `DATE_PICKER.yearsAhead` anos.
 * Uma data já salva fora dessa faixa (ex.: de um grupo antigo) amplia a faixa para continuar aparecendo.
 */
export function eventYearRange(selected?: DateValue): DateValue[] {
  const now = today(getLocalTimeZone())
  const start = selected && selected.year < now.year ? selected : now
  const lastYear = now.year + DATE_PICKER.yearsAhead
  const end = selected && selected.year > lastYear ? selected : now.add({ years: DATE_PICKER.yearsAhead })
  return createYearRange({ start, end })
}
