import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildEventIcs } from '@/modules/secret-santa/lib/calendar'

describe('buildEventIcs', () => {
  const ics = buildEventIcs('k7x2m9', 'Família, Silva; 2026', '2026-12-31', dayjs('2026-10-07T12:30:45.123Z'))

  it('cria um evento de dia inteiro que termina no dia seguinte', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231')
    expect(ics).toContain('DTEND;VALUE=DATE:20270101')
    expect(ics).toContain('DTSTAMP:20261007T123045Z')
    expect(ics).toContain('UID:k7x2m9@canivete')
  })

  it('escapa vírgula e ponto e vírgula do título e usa quebras CRLF', () => {
    expect(ics).toContain(String.raw`SUMMARY:Amigo secreto: Família\, Silva\; 2026`)
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR')).toBe(true)
  })
})
