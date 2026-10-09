import { describe, expect, it } from 'vitest'
import { tools } from '@/core/modules/registry'

describe('módulos de comunicação', () => {
  it('whatsapp é descoberto pelo registro, sem backend', () => {
    const tool = tools.find((item) => item.id === 'whatsapp')
    expect(tool).toMatchObject({ title: 'Link de WhatsApp', category: 'Comunicação', usesBackend: false })
    expect(tool?.routes.map((route) => route.path)).toEqual(['/whatsapp'])
  })

  it('qrcode é descoberto pelo registro, sem backend', () => {
    const tool = tools.find((item) => item.id === 'qrcode')
    expect(tool).toMatchObject({ title: 'Gerador de QR Code', category: 'Comunicação', usesBackend: false })
    expect(tool?.routes.map((route) => route.path)).toEqual(['/qrcode'])
  })

  it('text-counter é descoberto pelo registro, sem backend', () => {
    const tool = tools.find((item) => item.id === 'text-counter')
    expect(tool).toMatchObject({ title: 'Contador de texto', category: 'Texto', usesBackend: false })
    expect(tool?.routes.map((route) => route.path)).toEqual(['/text-counter'])
  })
})
