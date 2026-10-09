// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LEGAL } from '@/core/config'

vi.mock('vue-router', () => ({
  RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' },
}))

import CookieNotice from '@/core/layout/CookieNotice.vue'

describe('CookieNotice', () => {
  beforeEach(() => localStorage.clear())

  it('aparece na primeira visita, com link para a política', async () => {
    const wrapper = mount(CookieNotice)
    await flushPromises()
    expect(wrapper.text()).toContain('cookie de login')
    expect(wrapper.find('a').attributes('data-to')).toBe('/privacy')
  })

  it('some ao tocar em Entendi e não volta enquanto a política for a mesma', async () => {
    const wrapper = mount(CookieNotice)
    await flushPromises()
    await wrapper.find('button').trigger('click')
    expect(localStorage.getItem(LEGAL.noticeStorageKey)).toBe(LEGAL.updatedAt)
    const again = mount(CookieNotice)
    await flushPromises()
    expect(again.find('aside').exists()).toBe(false)
  })

  it('volta quando a política muda de data', async () => {
    localStorage.setItem(LEGAL.noticeStorageKey, '2000-01-01')
    const wrapper = mount(CookieNotice)
    await flushPromises()
    expect(wrapper.find('aside').exists()).toBe(true)
  })
})
