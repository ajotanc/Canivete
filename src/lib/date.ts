import { parseDate, type DateValue } from '@internationalized/date'

/** O Calendar do shadcn trabalha com `DateValue`; o app guarda a data como texto ISO (AAAA-MM-DD, ou vazio). */

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

/** "24/12/2026". */
export const formatDateNumeric = (value: DateValue): string => `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${value.year}`

/** "2026-12-24" vira "24/12/2026"; vazio ou inválido vira vazio. */
export function isoToNumeric(iso: string): string {
  const value = isoToDateValue(iso)
  return value ? formatDateNumeric(value) : ''
}

/** "24/12/2026" vira "2026-12-24". Só aceita dia que existe (31/02 não); texto incompleto ou inválido devolve `null`. */
export function numericToIso(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim())
  if (!match) return null
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${match[3]}-${match[2]}-${match[1]}`
}
