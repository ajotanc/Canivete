// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getGroup = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'k7x2m9' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' },
}))

vi.mock('@/modules/secret-santa/lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/modules/secret-santa/lib/api')>()
  return { ...original, getGroup: (...args: unknown[]) => getGroup(...args) }
})

import GroupView from '@/modules/secret-santa/GroupView.vue'

const names = ['Ana', 'João', 'Bia', 'Caio', 'Dani', 'Edu', 'Fábio', 'Gabi', 'Hugo']

function groupWith(members: { name: string; hasPin: boolean }[]) {
  return { id: 'k7x2m9', slug: null, name: 'Turma', budget: null, eventDate: '', status: 'open', participantCount: members.length, color: 'berry', members }
}

const mountView = () => mount(GroupView, { global: { stubs: { RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' } } } })

describe('GroupView: escolha do nome', () => {
  beforeEach(() => {
    sessionStorage.clear()
    getGroup.mockReset()
  })

  it('só mostra a busca quando a lista é longa e ignora acento e caixa', async () => {
    getGroup.mockResolvedValue(groupWith(names.slice(0, 3).map((name) => ({ name, hasPin: false }))))
    const short = mountView()
    await flushPromises()
    expect(short.text()).toContain('Quem é você?')
    expect(short.find('input[type="search"]').exists()).toBe(false)

    getGroup.mockResolvedValue(groupWith(names.map((name) => ({ name, hasPin: false }))))
    const wrapper = mountView()
    await flushPromises()
    const search = wrapper.find('input[type="search"]')
    expect(search.exists()).toBe(true)

    await search.setValue('joao')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('João')

    await search.setValue('zzz')
    expect(wrapper.text()).toContain('Ninguém com esse nome')
  })

  it('oferece continuar como a pessoa que já entrou nesta aba', async () => {
    sessionStorage.setItem('santa:cred:k7x2m9', JSON.stringify({ name: 'Ana', pin: '1234' }))
    getGroup.mockResolvedValue(groupWith([{ name: 'Ana', hasPin: true }, { name: 'Bia', hasPin: false }]))
    const wrapper = mountView()
    await flushPromises()
    const link = wrapper.findAll('a').find((a) => a.text().includes('Continuar como Ana'))
    expect(link?.attributes('data-to')).toBe('/secret-santa/g/k7x2m9/me')
  })

  it('não oferece continuar sem sessão, nem para quem ainda não criou o PIN', async () => {
    getGroup.mockResolvedValue(groupWith([{ name: 'Ana', hasPin: true }]))
    const semSessao = mountView()
    await flushPromises()
    expect(semSessao.text()).not.toContain('Continuar como')

    sessionStorage.setItem('santa:cred:k7x2m9', JSON.stringify({ name: 'Bia', pin: '1234' }))
    getGroup.mockResolvedValue(groupWith([{ name: 'Bia', hasPin: false }]))
    const semPin = mountView()
    await flushPromises()
    expect(semPin.text()).not.toContain('Continuar como')
  })
})
