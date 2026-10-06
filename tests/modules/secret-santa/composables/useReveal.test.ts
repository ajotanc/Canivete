import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReveal } from '@/modules/secret-santa/composables/useReveal'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useReveal', () => {
  it('começa escondido, revela e esconde manualmente', () => {
    const { revealed, reveal, hide } = useReveal()
    expect(revealed.value).toBe(false)
    reveal()
    expect(revealed.value).toBe(true)
    hide()
    expect(revealed.value).toBe(false)
  })

  it('esconde sozinho depois de 15 segundos', () => {
    const { revealed, reveal } = useReveal()
    reveal()
    vi.advanceTimersByTime(14_999)
    expect(revealed.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(revealed.value).toBe(false)
  })

  it('revelar de novo reinicia a contagem', () => {
    const { revealed, reveal } = useReveal(1000)
    reveal()
    vi.advanceTimersByTime(800)
    reveal()
    vi.advanceTimersByTime(800)
    expect(revealed.value).toBe(true)
    vi.advanceTimersByTime(200)
    expect(revealed.value).toBe(false)
  })
})
