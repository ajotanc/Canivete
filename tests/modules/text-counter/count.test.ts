import { describe, expect, it } from 'vitest'
import { countText, formatDuration } from '@/modules/text-counter/lib/count'

describe('countText', () => {
  it('texto vazio zera tudo', () => {
    expect(countText('')).toEqual({ characters: 0, charactersNoSpaces: 0, words: 0, sentences: 0, paragraphs: 0, lines: 0, readingSeconds: 0, speakingSeconds: 0 })
  })

  it('conta caracteres com e sem espaços', () => {
    const stats = countText('Olá, mundo!')
    expect(stats.characters).toBe(11)
    expect(stats.charactersNoSpaces).toBe(10)
  })

  it('conta emoji e letras acentuadas como um caractere', () => {
    expect(countText('ação 👍🏽').characters).toBe(6)
    expect(countText('é').characters).toBe(1)
  })

  it('conta palavras ignorando pontuação e espaços repetidos', () => {
    expect(countText('  Uma   frase, com pontuação!  ').words).toBe(4)
  })

  it('conta frases, parágrafos e linhas', () => {
    const stats = countText('Primeira frase. Segunda frase? Terceira!\n\nOutro parágrafo.\nOutra linha.')
    expect(stats.sentences).toBe(5)
    expect(stats.paragraphs).toBe(2)
    expect(stats.lines).toBe(4)
  })

  it('estima tempo de leitura e de fala pelas palavras', () => {
    const words = Array.from({ length: 200 }, () => 'palavra').join(' ')
    const stats = countText(words)
    expect(stats.readingSeconds).toBe(60)
    expect(stats.speakingSeconds).toBe(92)
  })
})

describe('formatDuration', () => {
  it('formata segundos e minutos', () => {
    expect(formatDuration(0)).toBe('0 s')
    expect(formatDuration(45)).toBe('45 s')
    expect(formatDuration(60)).toBe('1 min')
    expect(formatDuration(150)).toBe('2 min 30 s')
  })
})
