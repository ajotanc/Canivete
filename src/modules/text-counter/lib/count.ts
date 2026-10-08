/** Contagens de um texto: caracteres, palavras, frases, parágrafos, linhas e tempos de leitura e de fala. */

/** Palavras lidas por minuto em voz alta e em silêncio (médias para o português). */
export const READING_WPM = 200
export const SPEAKING_WPM = 130

export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  lines: number
  /** Segundos de leitura silenciosa. */
  readingSeconds: number
  /** Segundos de fala em voz alta. */
  speakingSeconds: number
}

const hasSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl

/** Letras como o olho vê: um emoji ou uma letra com acento conta como um caractere só. */
function graphemeCount(text: string): number {
  if (!text) return 0
  if (hasSegmenter) {
    let total = 0
    for (const _ of new Intl.Segmenter('pt-BR', { granularity: 'grapheme' }).segment(text)) total += 1
    return total
  }
  return Array.from(text).length
}

function wordCount(text: string): number {
  if (!text.trim()) return 0
  if (hasSegmenter) {
    let total = 0
    for (const part of new Intl.Segmenter('pt-BR', { granularity: 'word' }).segment(text)) if (part.isWordLike) total += 1
    return total
  }
  return text.trim().split(/\s+/).length
}

export function countText(text: string): TextStats {
  const normalized = text.replace(/\r\n?/g, '\n')
  const words = wordCount(normalized)
  return {
    characters: graphemeCount(normalized),
    charactersNoSpaces: graphemeCount(normalized.replace(/\s/g, '')),
    words,
    sentences: normalized.split(/[.!?…]+(?:\s|$)/).filter((part) => /[\p{L}\p{N}]/u.test(part)).length,
    paragraphs: normalized.split(/\n\s*\n/).filter((part) => part.trim()).length,
    lines: normalized === '' ? 0 : normalized.split('\n').length,
    readingSeconds: Math.round((words / READING_WPM) * 60),
    speakingSeconds: Math.round((words / SPEAKING_WPM) * 60),
  }
}

/** "30 s", "1 min", "2 min 30 s"; "0 s" quando não há texto. */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`
}
