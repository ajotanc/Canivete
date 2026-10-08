// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Alert, alertVariants } from '@/components/ui/alert'

describe('Alert', () => {
  it('tem uma variante para cada cor do app, com borda da própria cor', () => {
    const colors = { destructive: 'destructive', success: 'success', warning: 'warning', info: 'info' } as const
    for (const [variant, color] of Object.entries(colors)) {
      const classes = alertVariants({ variant: variant as keyof typeof colors })
      expect(classes).toContain(`text-${color}`)
      expect(classes).toContain(`border-${color}/30`)
    }
  })

  it('a variante padrão não tem cor própria', () => {
    expect(alertVariants({ variant: 'default' })).toContain('text-card-foreground')
  })

  it('renderiza com role alert e o texto', () => {
    const wrapper = mount(Alert, { props: { variant: 'success' }, slots: { default: 'Pronto' } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.text()).toBe('Pronto')
  })
})
