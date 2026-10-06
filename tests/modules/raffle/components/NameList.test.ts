// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NameList from '@/modules/raffle/components/NameList.vue'

describe('NameList', () => {
  it('mostra a contagem de nomes', () => {
    const wrapper = mount(NameList, { props: { modelValue: 'Ana\nBruno\n\nCarla' } })
    expect(wrapper.text()).toContain('3 nomes')
  })

  it('usa o singular com um nome', () => {
    const wrapper = mount(NameList, { props: { modelValue: 'Ana' } })
    expect(wrapper.text()).toContain('1 nome')
    expect(wrapper.text()).not.toContain('1 nomes')
  })

  it('avisa sobre duplicados sem removê-los', () => {
    const wrapper = mount(NameList, { props: { modelValue: 'Ana\nana' } })
    expect(wrapper.text()).toMatch(/duplicado/i)
    expect(wrapper.text()).toContain('2 nomes')
  })

  it('mostra o erro de limite quando há nomes demais', () => {
    const raw = Array.from({ length: 1001 }, (_, i) => `N${i}`).join('\n')
    const wrapper = mount(NameList, { props: { modelValue: raw } })
    expect(wrapper.text()).toContain('limite é de 1.000 nomes')
  })

  it('não mostra erro com a lista vazia (o botão de sortear é quem bloqueia)', () => {
    const wrapper = mount(NameList, { props: { modelValue: '' } })
    expect(wrapper.text()).toContain('0 nomes')
    expect(wrapper.text()).not.toContain('Adicione pelo menos')
  })
})
