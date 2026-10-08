import { describe, expect, it } from 'vitest'
import { extensionFor, fitWidth, formatBytes, isSupportedImage, outputName, sizeChangePercent } from '@/modules/image/lib/image'

describe('fitWidth', () => {
  it('reduz mantendo a proporção', () => {
    expect(fitWidth({ width: 4000, height: 3000 }, 1000)).toEqual({ width: 1000, height: 750 })
  })

  it('nunca aumenta', () => {
    expect(fitWidth({ width: 800, height: 600 }, 1000)).toEqual({ width: 800, height: 600 })
  })

  it('zero ou vazio não limita', () => {
    expect(fitWidth({ width: 800, height: 600 }, 0)).toEqual({ width: 800, height: 600 })
    expect(fitWidth({ width: 800, height: 600 }, Number.NaN)).toEqual({ width: 800, height: 600 })
  })

  it('a altura nunca fica zero', () => {
    expect(fitWidth({ width: 10_000, height: 2 }, 100).height).toBe(1)
  })
})

describe('formatBytes', () => {
  it('escolhe a unidade', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(340_000)).toBe('340 kB')
    expect(formatBytes(1_234_567)).toBe('1,2 MB')
  })
})

describe('nomes e tipos', () => {
  it('troca a extensão e marca como comprimida', () => {
    expect(outputName('foto.png', 'image/jpeg')).toBe('foto-comprimida.jpg')
    expect(outputName('minha.foto.final.HEIC', 'image/webp')).toBe('minha.foto.final-comprimida.webp')
    expect(outputName('semextensao', 'image/png')).toBe('semextensao-comprimida.png')
    expect(outputName('.png', 'image/png')).toBe('.png-comprimida.png')
  })

  it('acha a extensão do formato', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('image/webp')).toBe('webp')
  })

  it('reconhece só imagens que o navegador abre', () => {
    expect(isSupportedImage('image/jpeg')).toBe(true)
    expect(isSupportedImage('image/heic')).toBe(false)
    expect(isSupportedImage('application/pdf')).toBe(false)
  })
})

describe('sizeChangePercent', () => {
  it('mostra a variação do tamanho', () => {
    expect(sizeChangePercent(100_000, 40_000)).toBe(-60)
    expect(sizeChangePercent(100_000, 120_000)).toBe(20)
    expect(sizeChangePercent(0, 10)).toBe(0)
  })
})
