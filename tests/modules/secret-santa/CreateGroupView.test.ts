// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const user = ref<{ id: string; name: string; email: string } | null>(null)
const listMyGroups = vi.fn()

vi.mock('@/core/services/auth', () => ({
  useAuth: () => ({ user, ready: ref(true) }),
  loadUser: () => Promise.resolve(),
  logout: () => Promise.resolve(),
}))

vi.mock('@/modules/secret-santa/lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/modules/secret-santa/lib/api')>()
  return { ...original, listMyGroups: (...args: unknown[]) => listMyGroups(...args), createGroup: vi.fn() }
})

import CreateGroupView from '@/modules/secret-santa/CreateGroupView.vue'

const mounted: ReturnType<typeof mount>[] = []

function mountView() {
  const wrapper = mount(CreateGroupView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, AuthForm: true }, mocks: { $router: { push: vi.fn() } } },
  })
  mounted.push(wrapper)
  return wrapper
}

describe('CreateGroupView: lista de grupos da conta', () => {
  beforeEach(() => {
    user.value = null
    listMyGroups.mockReset()
    listMyGroups.mockResolvedValue({ groups: [{ id: 'g1', slug: null, name: 'Família da Bagunça', status: 'open' }] })
  })

  // Cada teste desmonta o que montou: o `user` é compartilhado e componentes antigos ainda reagiriam a ele.
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  it('não pede os grupos enquanto a pessoa não está conectada', async () => {
    mountView()
    await flushPromises()
    expect(listMyGroups).not.toHaveBeenCalled()
  })

  it('carrega e mostra os grupos assim que a pessoa entra, sem precisar recarregar a página', async () => {
    const wrapper = mountView()
    await flushPromises()

    user.value = { id: 'u1', name: 'Ana', email: 'ana@exemplo.com' }
    await nextTick()
    await flushPromises()

    expect(listMyGroups).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Família da Bagunça')
  })

  it('carrega os grupos quando a sessão já estava aberta', async () => {
    user.value = { id: 'u1', name: 'Ana', email: 'ana@exemplo.com' }
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('Família da Bagunça')
  })
})
