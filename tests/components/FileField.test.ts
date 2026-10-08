// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FileField from '@/components/FileField.vue'

const props = { id: 'f', description: 'Escolha um arquivo' }

describe('FileField', () => {
  it('emite select com o arquivo escolhido', async () => {
    const wrapper = mount(FileField, { props })
    const input = wrapper.find('input[type="file"]')
    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    expect(wrapper.emitted('select')?.[0]).toEqual([file])
  })

  it('emite select ao soltar um arquivo na área', async () => {
    const wrapper = mount(FileField, { props })
    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    await wrapper.find('label').trigger('drop', { dataTransfer: { files: [file] } })
    expect(wrapper.emitted('select')?.[0]).toEqual([file])
  })

  it('sem arquivo não emite nada', async () => {
    const wrapper = mount(FileField, { props })
    await wrapper.find('input[type="file"]').trigger('change')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('mostra a descrição e liga o rótulo ao campo', () => {
    const wrapper = mount(FileField, { props })
    expect(wrapper.text()).toContain('Escolha um arquivo')
    expect(wrapper.find('label').attributes('for')).toBe('f')
  })
})
