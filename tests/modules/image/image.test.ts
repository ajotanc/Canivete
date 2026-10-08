import { describe, expect, it } from 'vitest'
import { extensionFor, fitWidth, formatBytes, isSupportedImage, isSvg, outputName, sizeChangePercent, svgSize } from '@/modules/image/lib/image'

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
    expect(isSupportedImage('image/svg+xml')).toBe(true)
    expect(isSvg('image/svg+xml')).toBe(true)
    expect(isSvg('image/png')).toBe(false)
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

describe('svgSize', () => {
  it('lê width e height da tag raiz', () => {
    expect(svgSize('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"></svg>')).toEqual({ width: 120, height: 80 })
    expect(svgSize("<svg width='64px' height='32.5px'/>")).toEqual({ width: 64, height: 32.5 })
  })

  it('usa o viewBox quando faltam width e height', () => {
    expect(svgSize('<svg viewBox="0 0 24 24"></svg>')).toEqual({ width: 24, height: 24 })
    expect(svgSize('<svg viewBox="0,0,300,150"></svg>')).toEqual({ width: 300, height: 150 })
  })

  it('completa o lado que falta pela proporção do viewBox', () => {
    expect(svgSize('<svg width="200" viewBox="0 0 100 50"></svg>')).toEqual({ width: 200, height: 100 })
    expect(svgSize('<svg height="100" viewBox="0 0 100 50"></svg>')).toEqual({ width: 200, height: 100 })
  })

  it('porcentagem e unidades sem suporte caem no viewBox', () => {
    expect(svgSize('<svg width="100%" height="100%" viewBox="0 0 10 20"></svg>')).toEqual({ width: 10, height: 20 })
  })

  it('devolve null sem tamanho nenhum ou sem tag svg', () => {
    expect(svgSize('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBeNull()
    expect(svgSize('<svg width="100%"></svg>')).toBeNull()
    expect(svgSize('<div></div>')).toBeNull()
    expect(svgSize('')).toBeNull()
  })

  it('não confunde com outras tags que começam com svg', () => {
    expect(svgSize('<svgfoo width="10" height="10"></svgfoo>')).toBeNull()
  })

  it('ignora atributos de elementos filhos', () => {
    expect(svgSize('<svg viewBox="0 0 50 50"><rect width="10" height="10"/></svg>')).toEqual({ width: 50, height: 50 })
  })
})
