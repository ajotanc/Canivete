// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CopyRows from '@/components/CopyRows.vue'

const success = vi.fn()
const failure = vi.fn()
vi.mock('vue-sonner', () => ({ toast: { success: (...args: unknown[]) => success(...args), error: (...args: unknown[]) => failure(...args) } }))

const rows = [
  { label: 'CEP', value: '01310-100' },
  { label: 'Rua', value: 'Avenida Paulista' },
  { label: 'Cidade', value: 'São Paulo' },
]

describe('CopyRows', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    success.mockClear()
    failure.mockClear()
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  it('mostra cada campo com rótulo, valor e o próprio botão de copiar', () => {
    const wrapper = mount(CopyRows, { props: { rows } })
    expect(wrapper.findAll('dt').map((node) => node.text())).toEqual(['CEP', 'Rua', 'Cidade'])
    expect(wrapper.findAll('dd').map((node) => node.text())).toEqual(['01310-100', 'Avenida Paulista', 'São Paulo'])
    expect(wrapper.findAll('button').map((button) => button.attributes('aria-label'))).toEqual(['Copiar cep', 'Copiar rua', 'Copiar cidade'])
  })

  it('cada botão copia só o valor do seu campo e avisa', async () => {
    const wrapper = mount(CopyRows, { props: { rows } })
    await wrapper.findAll('button')[1].trigger('click')
    await Promise.resolve()
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('Avenida Paulista')
    expect(success).toHaveBeenCalledWith('Rua copiado.')
  })

  it('avisa quando o navegador não deixa copiar', async () => {
    writeText.mockRejectedValue(new Error('negado'))
    const wrapper = mount(CopyRows, { props: { rows } })
    await wrapper.findAll('button')[0].trigger('click')
    await Promise.resolve()
    await Promise.resolve()
    expect(failure).toHaveBeenCalledTimes(1)
    expect(success).not.toHaveBeenCalled()
  })

  it('sem campos não mostra botões', () => {
    expect(mount(CopyRows, { props: { rows: [] } }).findAll('button')).toHaveLength(0)
  })
})
