import { describe, expect, it } from 'vitest'
import { beam, beamSvg, contrastOn, PALETTES, paletteFor } from '@/modules/fake-data/lib/avatar'

describe('avatar beam', () => {
  it('o mesmo nome gera sempre o mesmo rosto', () => {
    expect(beamSvg('Ana Souza')).toBe(beamSvg('Ana Souza'))
    expect(beamSvg('Ana Souza')).not.toBe(beamSvg('Bruno Lima'))
  })

  it('usa uma das paletas, e nomes diferentes caem em paletas variadas', () => {
    expect(PALETTES).toContain(paletteFor('Ana Souza'))
    const used = new Set(['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Rocha', 'Elisa Martins', 'Fábio Nunes', 'Gabi Torres', 'Hugo Alves'].map(paletteFor))
    expect(used.size).toBeGreaterThan(2)
  })

  it('o rosto contrasta com a cor de trás', () => {
    expect(contrastOn('#FFFFFF')).toBe('#000000')
    expect(contrastOn('#0E1420')).toBe('#FFFFFF')
    const face = beam('Ana Souza')
    expect(face.face).toBe(contrastOn(face.wrapper))
  })

  it('gera um SVG quadrado completo', () => {
    const svg = beamSvg('Ana Souza', 512)
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 36 36" width="512" height="512"/)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg).not.toContain('NaN')
  })
})
