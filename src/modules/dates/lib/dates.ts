/**
 * Datas como texto ISO ("AAAA-MM-DD"), calculadas em UTC para o horário de verão não mexer nos dias.
 */

const DAY_MS = 86_400_000

export const toUtc = (iso: string): Date => new Date(`${iso}T00:00:00Z`)
export const toIso = (date: Date): string => date.toISOString().slice(0, 10)

/** Texto "AAAA-MM-DD" que é uma data real (rejeita 2026-02-30). */
export function isValidIso(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const date = toUtc(iso)
  return !Number.isNaN(date.getTime()) && toIso(date) === iso
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(toUtc(iso).getTime() + days * DAY_MS))
}

/** Dias de `from` até `to` (negativo se `to` for antes). */
export const daysBetween = (from: string, to: string): number => Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS)

/** Domingo da Páscoa do ano (algoritmo de Meeus/Jones/Butcher). */
export function easter(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const FIXED_HOLIDAYS: ReadonlyArray<[string, string]> = [
  ['01-01', 'Confraternização Universal'],
  ['04-21', 'Tiradentes'],
  ['05-01', 'Dia do Trabalho'],
  ['09-07', 'Independência do Brasil'],
  ['10-12', 'Nossa Senhora Aparecida'],
  ['11-02', 'Finados'],
  ['11-15', 'Proclamação da República'],
  ['11-20', 'Consciência Negra'],
  ['12-25', 'Natal'],
]

/** Feriados nacionais do ano: data ISO → nome. Inclui a Sexta-feira Santa; não inclui Carnaval nem feriados locais. */
export function nationalHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>(FIXED_HOLIDAYS.map(([day, name]) => [`${year}-${day}`, name]))
  holidays.set(addDays(easter(year), -2), 'Sexta-feira Santa')
  return holidays
}

/** Nome do feriado nacional da data, ou `undefined`. */
export const holidayName = (iso: string): string | undefined => nationalHolidays(Number(iso.slice(0, 4))).get(iso)

/** Segunda a sexta que não é feriado nacional. */
export function isBusinessDay(iso: string): boolean {
  const weekday = toUtc(iso).getUTCDay()
  return weekday !== 0 && weekday !== 6 && !holidayName(iso)
}

/** Soma (ou subtrai, se negativo) dias úteis a partir da data, sem contar a própria data. */
export function addBusinessDays(iso: string, amount: number): string {
  const step = amount < 0 ? -1 : 1
  let current = iso
  let left = Math.abs(amount)
  while (left > 0) {
    current = addDays(current, step)
    if (isBusinessDay(current)) left--
  }
  return current
}

/** Dias úteis entre as datas, contando `from` (se útil) e não contando `to`. Ordem trocada vale o mesmo. */
export function businessDaysBetween(from: string, to: string): number {
  const [start, end] = from <= to ? [from, to] : [to, from]
  let count = 0
  for (let current = start; current < end; current = addDays(current, 1)) if (isBusinessDay(current)) count++
  return count
}

export interface Span {
  years: number
  months: number
  days: number
}

/** Anos, meses e dias inteiros entre duas datas (a ordem não importa). */
export function spanBetween(a: string, b: string): Span {
  const [from, to] = a <= b ? [a, b] : [b, a]
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  let totalMonths = (ty - fy) * 12 + (tm - fm)
  if (addMonths(from, totalMonths) > to) totalMonths--
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days: daysBetween(addMonths(from, totalMonths), to) }
}

/** Soma meses; se o dia não existe no mês de chegada (31 de fevereiro), cai no último dia dele. */
function addMonths(iso: string, months: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  const index = year * 12 + (month - 1) + months
  const targetYear = Math.floor(index / 12)
  const targetMonth = index % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  return `${String(targetYear).padStart(4, '0')}-${String(targetMonth + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}

export interface Age extends Span {
  /** Dias até o próximo aniversário (0 se é hoje). */
  daysToBirthday: number
}

/** Idade na data de referência. Quem nasceu em 29/02 faz aniversário em 01/03 nos anos comuns. */
export function ageOn(birth: string, reference: string): Age {
  const span = spanBetween(birth, reference)
  const [, month, day] = birth.split('-').map(Number)
  const refYear = Number(reference.slice(0, 4))
  const birthdayIn = (year: number) => {
    const leap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1
    return month === 2 && day === 29 && !leap ? `${year}-03-01` : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  let next = birthdayIn(refYear)
  if (next < reference) next = birthdayIn(refYear + 1)
  return { ...span, daysToBirthday: daysBetween(reference, next) }
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
export const weekdayName = (iso: string): string => WEEKDAYS[toUtc(iso).getUTCDay()]

const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })
/** "24 de dezembro de 2026". */
export const formatLong = (iso: string): string => longDate.format(toUtc(iso))

/** "1 ano, 2 meses e 3 dias". */
export function describeSpan(span: Span): string {
  const parts = [
    span.years && `${span.years} ${span.years === 1 ? 'ano' : 'anos'}`,
    span.months && `${span.months} ${span.months === 1 ? 'mês' : 'meses'}`,
    span.days && `${span.days} ${span.days === 1 ? 'dia' : 'dias'}`,
  ].filter(Boolean) as string[]
  if (parts.length === 0) return '0 dias'
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`
}

/** Data de hoje (fuso do aparelho) em ISO. */
export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
