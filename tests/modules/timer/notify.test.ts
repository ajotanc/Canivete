import { afterEach, describe, expect, it, vi } from 'vitest'
import { askNotifyPermission, notify, notifyState } from '@/modules/timer/lib/notify'

function fakeNotification(permission: NotificationPermission, requested: NotificationPermission = 'granted') {
  const created: Array<[string, NotificationOptions | undefined]> = []
  class Fake {
    static permission = permission
    static requestPermission = vi.fn(async () => {
      Fake.permission = requested
      return requested
    })
    constructor(title: string, options?: NotificationOptions) {
      created.push([title, options])
    }
  }
  vi.stubGlobal('Notification', Fake)
  return { Fake, created }
}

afterEach(() => vi.unstubAllGlobals())

describe('avisos do navegador', () => {
  it('sem suporte, informa e não faz nada', async () => {
    vi.stubGlobal('Notification', undefined)
    expect(notifyState()).toBe('unsupported')
    expect(await askNotifyPermission()).toBe('unsupported')
    await expect(notify('a', 'b')).resolves.toBeUndefined()
  })

  it('pede a permissão só quando ainda não foi decidida', async () => {
    const { Fake } = fakeNotification('default', 'granted')
    expect(await askNotifyPermission()).toBe('granted')
    expect(Fake.requestPermission).toHaveBeenCalledTimes(1)
    await askNotifyPermission()
    expect(Fake.requestPermission).toHaveBeenCalledTimes(1)
  })

  it('não pergunta de novo quando já foi negada', async () => {
    const { Fake } = fakeNotification('denied')
    expect(await askNotifyPermission()).toBe('denied')
    expect(Fake.requestPermission).not.toHaveBeenCalled()
  })

  it('mostra o aviso quando permitido', async () => {
    const { created } = fakeNotification('granted')
    await notify('Pausa curta', 'Hora de uma pausa.')
    expect(created).toHaveLength(1)
    expect(created[0][0]).toBe('Pausa curta')
    expect(created[0][1]?.body).toBe('Hora de uma pausa.')
  })

  it('não mostra nada sem permissão', async () => {
    const { created } = fakeNotification('denied')
    await notify('x', 'y')
    expect(created).toHaveLength(0)
  })
})
