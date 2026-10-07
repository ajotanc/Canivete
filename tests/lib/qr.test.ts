import { describe, expect, it } from 'vitest'
import { qrPng, qrSvg } from '@/lib/qr'

describe('qr', () => {
  it('gera SVG com as cores pedidas', async () => {
    const svg = await qrSvg('https://wa.me/5511912345678', { dark: '#1d4ed8' })
    expect(svg).toContain('<svg')
    expect(svg).toContain('#1d4ed8')
  })

  it('gera PNG como data URL', async () => {
    expect(await qrPng('oi', { width: 256 })).toMatch(/^data:image\/png;base64,/)
  })

  it('recusa conteúdo grande demais para um QR Code', async () => {
    await expect(qrSvg('a'.repeat(4000))).rejects.toThrow()
  })
})
