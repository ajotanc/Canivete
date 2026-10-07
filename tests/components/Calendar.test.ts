// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Calendar } from '@/components/ui/calendar'

describe('Calendar (shadcn)', () => {
  const mountCalendar = () => mount(Calendar, { props: { locale: 'pt-BR', layout: 'month-and-year', weekdayFormat: 'short' } })

  it('dá nome aos selects de mês e ano para leitores de tela', () => {
    const labels = mountCalendar().findAll('[data-slot=select-trigger]').map((s) => s.attributes('aria-label'))
    expect(labels).toEqual(['Mês', 'Ano'])
  })

  it('mostra os dias da semana com três letras, sem repetir inicial', () => {
    const heads = mountCalendar().findAll('th').map((th) => th.text().replace('.', ''))
    expect(heads).toHaveLength(7)
    expect(new Set(heads).size).toBe(7)
    expect(heads.every((h) => h.length === 3)).toBe(true)
  })
})
