import dayjs from 'dayjs'

/** Texto de um campo iCalendar: barra, ponto e vírgula, vírgula e quebra de linha precisam de escape. */
const escapeText = (value: string) => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Evento de dia inteiro (.ics) para a data da troca; `iso` é AAAA-MM-DD. `now` existe para os testes. */
export function buildEventIcs(groupId: string, groupName: string, iso: string, now: dayjs.Dayjs = dayjs()): string {
  const start = dayjs(iso)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Canivete//Amigo secreto//PT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${groupId}@canivete`,
    `DTSTAMP:${now.toDate().toISOString().replace(/[-:]|\.\d{3}/g, '')}`,
    `DTSTART;VALUE=DATE:${start.format('YYYYMMDD')}`,
    `DTEND;VALUE=DATE:${start.add(1, 'day').format('YYYYMMDD')}`,
    `SUMMARY:${escapeText(`Amigo secreto: ${groupName}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Baixa o evento como arquivo .ics, que abre em qualquer agenda. */
export function downloadEventIcs(groupId: string, groupName: string, iso: string): void {
  const blob = new Blob([buildEventIcs(groupId, groupName, iso)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'amigo-secreto.ics'
  link.click()
  URL.revokeObjectURL(url)
}
