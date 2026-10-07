// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useRefreshOnFocus } from '@/modules/secret-santa/composables/useRefreshOnFocus'

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useRefreshOnFocus', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function mountWith(refresh: () => void) {
    return mount(defineComponent({ setup() { useRefreshOnFocus(refresh, 5000); return () => h('div') } }))
  }

  it('atualiza ao voltar para a aba, mas não ao sair e não repetido em sequência', () => {
    const refresh = vi.fn()
    const wrapper = mountWith(refresh)

    setVisibility('hidden')
    setVisibility('visible')
    expect(refresh).not.toHaveBeenCalled() // ainda dentro do intervalo mínimo

    vi.advanceTimersByTime(5000)
    setVisibility('hidden')
    expect(refresh).not.toHaveBeenCalled()
    setVisibility('visible')
    expect(refresh).toHaveBeenCalledTimes(1)
    setVisibility('visible')
    expect(refresh).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('para de ouvir quando a tela sai', () => {
    const refresh = vi.fn()
    mountWith(refresh).unmount()
    vi.advanceTimersByTime(10_000)
    setVisibility('visible')
    expect(refresh).not.toHaveBeenCalled()
  })
})
