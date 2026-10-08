// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GiftTag from '@/modules/secret-santa/components/GiftTag.vue'

const play = vi.fn()
vi.mock('@/core/effects/sound', () => ({ play: (...args: unknown[]) => play(...args) }))

const handle = (wrapper: ReturnType<typeof mount>) => wrapper.find('button[aria-label^="Arraste"]')

describe('GiftTag: som da carta', () => {
  beforeEach(() => play.mockClear())

  it('toca o som de abrir uma vez quando a carta abre, junto do aviso de que foi revelada', async () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana', revealed: false } })
    await handle(wrapper).trigger('keydown.enter')
    expect(play).toHaveBeenCalledTimes(1)
    expect(play).toHaveBeenCalledWith('unseal')
    expect(wrapper.emitted('reveal')).toHaveLength(1)
  })

  it('abrir de novo uma carta já aberta não toca outra vez', async () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana', revealed: false } })
    const seal = handle(wrapper)
    await seal.trigger('keydown.enter')
    // Mesmo que o lacre ainda receba o evento, a carta já está aberta: nada toca de novo.
    await seal.trigger('keydown.space')
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('uma carta que já nasce aberta fica em silêncio', () => {
    mount(GiftTag, { props: { name: 'Ana', revealed: true } })
    expect(play).not.toHaveBeenCalled()
  })

  it('a carta só se abre depois de puxar tudo: puxar pela metade não toca', async () => {
    const wrapper = mount(GiftTag, { props: { name: 'Ana', revealed: false } })
    await handle(wrapper).trigger('keydown.right')
    expect(play).not.toHaveBeenCalled()
  })
})
