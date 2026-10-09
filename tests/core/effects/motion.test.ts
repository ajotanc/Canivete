// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MotionNotice from '@/components/MotionNotice.vue'
import { forceMotion, motionReduced, systemReducesMotion } from '@/core/effects/motion'

function systemPrefers(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}

beforeEach(() => {
  localStorage.clear()
  forceMotion.value = false
})
afterEach(() => vi.unstubAllGlobals())

describe('motionReduced', () => {
  it('sem pedido do sistema, anima', () => {
    systemPrefers(false)
    expect(systemReducesMotion()).toBe(false)
    expect(motionReduced()).toBe(false)
  })

  it('com o sistema pedindo menos movimento, pula os giros', () => {
    systemPrefers(true)
    expect(systemReducesMotion()).toBe(true)
    expect(motionReduced()).toBe(true)
  })

  it('"Animar mesmo assim" vale mais que o pedido do sistema', () => {
    systemPrefers(true)
    forceMotion.value = true
    expect(motionReduced()).toBe(false)
  })

  it('navegador sem matchMedia anima', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(systemReducesMotion()).toBe(false)
    expect(motionReduced()).toBe(false)
  })

  it('a escolha fica guardada neste aparelho', async () => {
    forceMotion.value = true
    await nextTick()
    expect(localStorage.getItem('canivete:force-motion')).toBe('true')
  })
})

describe('MotionNotice', () => {
  it('não aparece quando o sistema não pede menos movimento', () => {
    systemPrefers(false)
    expect(mount(MotionNotice).text()).toBe('')
  })

  it('explica e oferece animar mesmo assim', () => {
    systemPrefers(true)
    const wrapper = mount(MotionNotice)
    expect(wrapper.text()).toContain('Animações reduzidas')
    expect(wrapper.text()).toContain('o resultado aparece direto')
    expect(wrapper.find('button').text()).toBe('Animar mesmo assim')
  })

  it('o botão liga e desliga a animação e o texto acompanha', async () => {
    systemPrefers(true)
    const wrapper = mount(MotionNotice)
    await wrapper.find('button').trigger('click')
    expect(forceMotion.value).toBe(true)
    expect(motionReduced()).toBe(false)
    expect(wrapper.text()).toContain('Animações ligadas')
    expect(wrapper.find('button').text()).toBe('Voltar a reduzir o movimento')
    await wrapper.find('button').trigger('click')
    expect(forceMotion.value).toBe(false)
    expect(motionReduced()).toBe(true)
  })
})
