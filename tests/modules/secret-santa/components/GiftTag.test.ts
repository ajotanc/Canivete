// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GiftTag from '@/modules/secret-santa/components/GiftTag.vue'

describe('GiftTag', () => {
  it('não coloca o nome no DOM enquanto está escondida', () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana Souza', revealed: false } })
    expect(wrapper.text()).not.toContain('Ana Souza')
    expect(wrapper.html()).not.toContain('Ana Souza')
  })

  it('mostra o nome quando revelada', () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana Souza', revealed: true } })
    expect(wrapper.text()).toContain('Ana Souza')
  })

  it('anuncia a mudança de forma educada para leitores de tela', () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana', revealed: true } })
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('volta a esconder o nome', async () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana', revealed: true } })
    await wrapper.setProps({ revealed: false })
    expect(wrapper.text()).not.toContain('Ana')
  })
})
