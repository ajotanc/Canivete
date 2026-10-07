import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

/** "2026-12-24" vira "24 de dezembro de 2026". */
export function formatEventDate(iso: string): string {
  return dayjs(iso).locale('pt-br').format('D [de] MMMM [de] YYYY')
}

/** Quanto falta para a data da troca, em linguagem simples. `today` existe para os testes. */
export function eventCountdown(iso: string, today: dayjs.Dayjs = dayjs()): string {
  const days = dayjs(iso).startOf('day').diff(today.startOf('day'), 'day')
  if (days > 1) return `Troca em ${days} dias`
  if (days === 1) return 'Troca amanhã'
  if (days === 0) return 'A troca é hoje'
  return 'Data da troca'
}
