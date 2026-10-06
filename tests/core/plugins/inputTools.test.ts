// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from "vue"
import { inputToolsPlugin } from '@/core/plugins/inputTools'
import { parseMoney } from '@/lib/money'

const nbsp = (text: string) => text.replace(/ /g, ' ')

describe('v-money', () => {
  const Host = defineComponent({
    template: '<input v-money v-model="value" />',
    setup: () => ({ value: ref('') }),
  })

  it('formata ao digitar e o v-model recebe o texto formatado', async () => {
    const wrapper = mount(Host, { global: { plugins: [inputToolsPlugin] } })
    const input = wrapper.find('input')
    await input.setValue('5000')
    expect(nbsp(input.element.value)).toBe('R$ 50,00')
    expect(parseMoney(input.element.value)).toBe(50)
    expect(nbsp((wrapper.vm as unknown as { value: string }).value)).toBe('R$ 50,00')
  })

  it("formata um valor que já veio preenchido", async () => {
    const Filled = defineComponent({
      template: '<input v-money v-model="value" />',
      setup: () => ({ value: ref('1234') }),
    })
    const wrapper = mount(Filled, { global: { plugins: [inputToolsPlugin] } })
    await nextTick()
    expect(nbsp(wrapper.find("input").element.value)).toBe("R$ 12,34")
  })
})
