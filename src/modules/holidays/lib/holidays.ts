import { daysBetween, nationalHolidays } from '@/modules/dates/lib/dates'

export interface Holiday {
  /** Data ISO (AAAA-MM-DD). */
  date: string
  name: string
}

export interface HolidayList {
  holidays: Holiday[]
  /** Verdadeiro se veio da internet; falso se foi calculado no aparelho (sem Carnaval nem Corpus Christi). */
  live: boolean
}

type Fetcher = typeof fetch

const BASE_URL = 'https://brasilapi.com.br/api/feriados/v1'

const byDate = (a: Holiday, b: Holiday) => a.date.localeCompare(b.date)

/** Feriados nacionais calculados no aparelho, usados quando a consulta online falha. */
export function offlineHolidays(year: number): Holiday[] {
  return [...nationalHolidays(year)].map(([date, name]) => ({ date, name })).sort(byDate)
}

/** Feriados nacionais do ano na BrasilAPI. Se a consulta falhar, cai nos calculados no aparelho. */
export async function loadHolidays(year: number, fetcher: Fetcher = fetch): Promise<HolidayList> {
  try {
    const response = await fetcher(`${BASE_URL}/${year}`)
    if (!response.ok) throw new Error('falhou')
    const data = (await response.json()) as Array<{ date?: string; name?: string }>
    const holidays = data.filter((item): item is Holiday => typeof item.date === 'string' && typeof item.name === 'string').sort(byDate)
    if (holidays.length === 0) throw new Error('vazio')
    return { holidays, live: true }
  } catch {
    return { holidays: offlineHolidays(year), live: false }
  }
}

/** Quantos dias faltam para a data (negativo se já passou). */
export const daysUntil = (iso: string, today: string): number => daysBetween(today, iso)

/** O primeiro feriado de hoje em diante, ou `undefined`. */
export const nextHoliday = (holidays: readonly Holiday[], today: string): Holiday | undefined => holidays.find((holiday) => holiday.date >= today)
