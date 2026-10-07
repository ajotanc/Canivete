// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TagInput from '@/components/TagInput.vue'

function last(wrapper: ReturnType<typeof mount>) {
  const events = wrapper.emitted('update:modelValue')!
  return events[events.length - 1][0]
}

describe('TagInput', () => {
  it('Enter adiciona o item e limpa o campo', async () => {
    const wrapper = mount(TagInput, { props: { modelValue: ['livro'] } })
    const input = wrapper.find('input')
    await input.setValue('  meias  de lã ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(last(wrapper)).toEqual(['livro', 'meias de lã'])
    expect(input.element.value).toBe('')
  })

  it('ignora vazio e repetido (sem diferenciar maiúsculas)', async () => {
    const wrapper = mount(TagInput, { props: { modelValue: ['Livro'] } })
    const input = wrapper.find('input')
    await input.setValue('livro')
    await input.trigger('keydown', { key: 'Enter' })
    await input.setValue('   ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('remove pelo botão', async () => {
    const wrapper = mount(TagInput, { props: { modelValue: ['a', 'b', 'c'] } })
    await wrapper.find('button[aria-label="Remover b"]').trigger('click')
    expect(last(wrapper)).toEqual(['a', 'c'])
  })

  it('respeita o limite de itens', async () => {
    const wrapper = mount(TagInput, { props: { modelValue: ['a'], maxItems: 1 } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})
