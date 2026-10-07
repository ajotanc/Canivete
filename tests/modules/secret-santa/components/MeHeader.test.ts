// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MeHeader from '@/modules/secret-santa/components/MeHeader.vue'

const group = { name: 'Turma', budget: 50, eventDate: '2026-12-24', participantCount: 4 }

function mountHeader(props: Partial<{ isOrganizer: boolean; group: typeof group | null }> = {}) {
  return mount(MeHeader, {
    props: { groupId: 'k7x2m9', group, description: 'Descrição', isOrganizer: false, ...props },
    global: { stubs: { RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' } } },
  })
}

describe('MeHeader', () => {
  it('leva de volta ao grupo pelo cabeçalho', () => {
    const link = mountHeader().findAll('a').find((a) => a.text().includes('Voltar ao grupo'))
    expect(link?.attributes('data-to')).toBe('/secret-santa/g/k7x2m9')
  })

  it('só mostra o painel do organizador para quem organiza', () => {
    expect(mountHeader().text()).not.toContain('Painel do organizador')
    expect(mountHeader({ isOrganizer: true }).text()).toContain('Painel do organizador')
  })

  it('avisa quando a pessoa clica em Sair', async () => {
    const wrapper = mountHeader()
    await wrapper.findAll('button').find((b) => b.text().includes('Sair'))!.trigger('click')
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  it('oferece a agenda só quando o grupo tem data', () => {
    expect(mountHeader().text()).toContain('Adicionar à agenda')
    expect(mountHeader({ group: { ...group, eventDate: '' } }).text()).not.toContain('Adicionar à agenda')
  })
})
