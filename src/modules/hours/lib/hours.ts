import { addDays, easter, nationalHolidays, toUtc } from '@/modules/dates/lib/dates'

/** Horas e durações em minutos inteiros. */

const MINUTES_PER_DAY = 1440

/** "08:30" ou "8:30" vira minutos desde a meia-noite; hora de 0 a 23 e minutos de 0 a 59. Fora disso, `null`. */
export function parseClock(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim())
  if (!match) return null
  const [hours, minutes] = [Number(match[1]), Number(match[2])]
  return hours > 23 || minutes > 59 ? null : hours * 60 + minutes
}

/** Duração "120:30" (até 999 horas) em minutos; os minutos vão de 0 a 59. Fora disso, `null`. */
export function parseSpan(text: string): number | null {
  const match = /^(\d{1,3}):(\d{2})$/.exec(text.trim())
  if (!match) return null
  const [hours, minutes] = [Number(match[1]), Number(match[2])]
  return minutes > 59 ? null : hours * 60 + minutes
}

/** Minutos como duração: 510 vira "8:30"; negativo ganha o sinal. */
export function formatSpan(minutes: number): string {
  const abs = Math.abs(Math.round(minutes))
  return `${minutes < 0 ? '-' : ''}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`
}

/** Minutos desde a meia-noite como "HH:MM" (dá a volta no dia). */
export function formatClock(minutes: number): string {
  const wrapped = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

/** Horas em decimal, com 2 casas: 510 minutos são 8,5 h. */
export const toDecimalHours = (minutes: number): number => Math.round((minutes / 60) * 100) / 100

export interface Worked {
  /** Tempo trabalhado, já sem o intervalo. Pode ser negativo se o intervalo é maior que o período. */
  minutes: number
  /** O fim caiu no dia seguinte (virou a meia-noite). */
  nextDay: boolean
}

/** Tempo entre o início e o fim, menos o intervalo. Se o fim é antes do início, conta como o dia seguinte. */
export function between(start: number, end: number, breakMinutes = 0): Worked {
  const nextDay = end < start
  return { minutes: (nextDay ? end + MINUTES_PER_DAY : end) - start - Math.max(0, breakMinutes), nextDay }
}

export interface Exit {
  clock: string
  /** Quantos dias depois da entrada cai a saída (0 no mesmo dia). */
  daysLater: number
}

/** Hora de saída: entrada, mais a jornada, mais o intervalo. */
export function exitTime(entry: number, workMinutes: number, breakMinutes: number): Exit {
  const total = entry + workMinutes + breakMinutes
  return { clock: formatClock(total), daysLater: Math.floor(total / MINUTES_PER_DAY) }
}

export interface Entry {
  sign: 1 | -1
  minutes: number
}

/** Soma as durações, somando ou subtraindo cada uma conforme o sinal. */
export const sumEntries = (entries: readonly Entry[]): number => entries.reduce((total, entry) => total + entry.sign * entry.minutes, 0)

export interface DayOff {
  /** Data ISO (AAAA-MM-DD). */
  date: string
  name: string
}

export interface WorkHoursOptions {
  /** Horas de trabalho de segunda a sexta, em minutos. */
  weekdayMinutes: number
  /** Horas de trabalho no sábado, em minutos (0 se não trabalha). */
  saturdayMinutes?: number
  /** Folga também na segunda e na terça de Carnaval e em Corpus Christi (pontos facultativos). */
  optionalDaysOff?: boolean
  /** Outras folgas (feriado do estado ou da cidade, emenda), em ISO. */
  extraDaysOff?: readonly string[]
}

export interface WorkHours {
  minutes: number
  /** Dias com expediente no período. */
  workdays: number
  /** Feriados e folgas que caíram em dia de expediente e ficaram de fora, em ordem de data. */
  daysOff: DayOff[]
}

/** Carnaval (segunda e terça) e Corpus Christi do ano: data ISO → nome. */
export function optionalHolidays(year: number): Map<string, string> {
  const sunday = easter(year)
  return new Map([
    [addDays(sunday, -48), 'Carnaval'],
    [addDays(sunday, -47), 'Carnaval'],
    [addDays(sunday, 60), 'Corpus Christi'],
  ])
}

/**
 * Horas úteis entre duas datas, contando as duas pontas (de 12 a 16 são cinco dias). Ordem trocada vale o mesmo.
 * Domingo nunca conta; sábado só se tiver horas. Feriado nacional e folga extra não contam.
 */
export function workHoursBetween(from: string, to: string, options: WorkHoursOptions): WorkHours {
  const [start, end] = from <= to ? [from, to] : [to, from]
  const extra = new Set(options.extraDaysOff ?? [])
  const yearHolidays = new Map<number, Map<string, string>>()
  const holidaysOf = (year: number) => {
    let map = yearHolidays.get(year)
    if (!map) {
      map = nationalHolidays(year)
      if (options.optionalDaysOff) for (const [date, name] of optionalHolidays(year)) if (!map.has(date)) map.set(date, name)
      yearHolidays.set(year, map)
    }
    return map
  }

  let minutes = 0
  let workdays = 0
  const daysOff: DayOff[] = []
  for (let current = start; current <= end; current = addDays(current, 1)) {
    const weekday = toUtc(current).getUTCDay()
    const dayMinutes = weekday === 0 ? 0 : weekday === 6 ? (options.saturdayMinutes ?? 0) : options.weekdayMinutes
    if (dayMinutes <= 0) continue
    const holiday = holidaysOf(Number(current.slice(0, 4))).get(current) ?? (extra.has(current) ? 'Folga' : undefined)
    if (holiday) {
      daysOff.push({ date: current, name: holiday })
      continue
    }
    minutes += dayMinutes
    workdays++
  }
  return { minutes, workdays, daysOff }
}
