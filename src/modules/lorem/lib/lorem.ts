import { secureRandomInt, type RandomInt } from '@/lib/random'

export type LoremUnit = 'paragraphs' | 'sentences' | 'words'
export type LoremLanguage = 'latin' | 'pt'

const LATIN = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua',
  'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in',
  'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa',
  'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'vitae', 'porta', 'nunc', 'mattis', 'tellus', 'urna', 'cursus', 'ligula', 'quam', 'varius',
] as const

const PORTUGUESE = [
  'casa', 'tempo', 'pessoa', 'caminho', 'livro', 'janela', 'cidade', 'manhã', 'rio', 'história', 'trabalho', 'amigo', 'noite', 'mesa', 'ponte', 'vento', 'jardim', 'estrada', 'sonho', 'palavra',
  'cada', 'muito', 'sempre', 'depois', 'antes', 'ainda', 'quando', 'porque', 'entre', 'sobre', 'durante', 'quase', 'talvez', 'agora', 'hoje', 'bem', 'mais', 'menos', 'junto', 'longe',
  'ver', 'fazer', 'chegar', 'contar', 'seguir', 'buscar', 'deixar', 'passar', 'pensar', 'esperar', 'aprender', 'encontrar', 'lembrar', 'crescer', 'mudar', 'abrir', 'guardar', 'trazer',
  'de', 'em', 'para', 'com', 'por', 'uma', 'um', 'que', 'não', 'se', 'como', 'e', 'ou', 'mas', 'foi', 'era', 'está', 'tem', 'são', 'vai',
] as const

export const CLASSIC_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'

export interface LoremOptions {
  unit: LoremUnit
  count: number
  language: LoremLanguage
  /** A primeira frase é a clássica "Lorem ipsum dolor sit amet…" (só em latim). */
  classicStart: boolean
  /** Embrulha cada parágrafo em <p>. */
  html: boolean
}

const pick = <T>(list: readonly T[], random: RandomInt): T => list[random(list.length)]
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

export function randomWords(count: number, language: LoremLanguage, random: RandomInt = secureRandomInt): string[] {
  const list = language === 'latin' ? LATIN : PORTUGUESE
  const words: string[] = []
  while (words.length < count) {
    const word = pick(list, random)
    if (word !== words[words.length - 1]) words.push(word)
  }
  return words
}

/** Uma frase de 6 a 14 palavras, com uma vírgula no meio se for longa. */
export function randomSentence(language: LoremLanguage, random: RandomInt = secureRandomInt): string {
  const words = randomWords(6 + random(9), language, random)
  if (words.length >= 9) words[3 + random(words.length - 6)] += ','
  return `${capitalize(words.join(' '))}.`
}

export function randomParagraph(language: LoremLanguage, random: RandomInt = secureRandomInt): string {
  return Array.from({ length: 3 + random(4) }, () => randomSentence(language, random)).join(' ')
}

/** Texto de preenchimento. A quantidade é limitada a 1–100 para a página não travar. */
export function generateLorem(options: LoremOptions, random: RandomInt = secureRandomInt): string {
  const count = Math.min(100, Math.max(1, Math.floor(options.count) || 1))
  const classic = options.classicStart && options.language === 'latin'

  if (options.unit === 'words') {
    const words = randomWords(count, options.language, random)
    if (classic) words.splice(0, Math.min(count, 5), ...['lorem', 'ipsum', 'dolor', 'sit', 'amet'].slice(0, count))
    return capitalize(words.join(' '))
  }

  if (options.unit === 'sentences') {
    const sentences = Array.from({ length: count }, () => randomSentence(options.language, random))
    if (classic) sentences[0] = CLASSIC_START
    return sentences.join(' ')
  }

  const paragraphs = Array.from({ length: count }, () => randomParagraph(options.language, random))
  if (classic) paragraphs[0] = `${CLASSIC_START} ${paragraphs[0]}`
  return options.html ? paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('\n') : paragraphs.join('\n\n')
}
