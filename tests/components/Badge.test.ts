// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Badge, badgeVariants } from '@/components/ui/badge'

describe('Badge', () => {
  it('tem raio padrão (não totalmente arredondado) e borda em qualquer variante', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline', 'tool', 'tool-tint', 'glass', 'success', 'warning', 'info', 'danger'] as const
    for (const variant of variants) {
      const classes = badgeVariants({ variant })
      expect(classes).toContain('rounded-md')
      expect(classes).not.toContain('rounded-full')
      expect(classes).toMatch(/\bborder\b/)
      expect(classes).not.toContain('border-transparent')
    }
  })

  it('a variante da home usa a cor clara da ferramenta', () => {
    expect(badgeVariants({ variant: 'tool-tint' })).toContain('bg-tool/20')
  })

  it('renderiza o texto', () => {
    expect(mount(Badge, { slots: { default: 'Texto' } }).text()).toBe('Texto')
  })
})
