// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WishlistEditor from '@/modules/secret-santa/components/WishlistEditor.vue'

describe('WishlistEditor', () => {
  it('adiciona um presente e só inclui o link quando o interruptor está ligado', async () => {
    const wrapper = mount(WishlistEditor, { props: { modelValue: [{ text: 'Meias', url: 'https://loja.com/meias' }] } })
    expect(wrapper.find('input[type="url"]').element).toHaveProperty('value', 'https://loja.com/meias')

    await wrapper.find('button[role="switch"]').trigger('click')
    const events = wrapper.emitted('update:modelValue')!
    expect(events.at(-1)).toEqual([[{ text: 'Meias' }]])

    await wrapper.findAll('button').find((b) => b.text().includes('Adicionar presente'))!.trigger('click')
    await wrapper.findAll('input[data-wish-text]').at(-1)!.setValue('Livro')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([[{ text: 'Meias' }, { text: 'Livro' }]])
  })
})
