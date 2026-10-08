export type TransformId =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'snake'
  | 'kebab'
  | 'no-accents'
  | 'slug'
  | 'trim-lines'
  | 'unique-lines'
  | 'sort-lines'
  | 'reverse-lines'
  | 'base64-encode'
  | 'base64-decode'
  | 'url-encode'
  | 'url-decode'

export interface Transform {
  id: TransformId
  label: string
  group: 'Maiúsculas e minúsculas' | 'Programação' | 'Linhas' | 'Codificação'
}

export const TRANSFORMS: readonly Transform[] = [
  { id: 'upper', label: 'MAIÚSCULAS', group: 'Maiúsculas e minúsculas' },
  { id: 'lower', label: 'minúsculas', group: 'Maiúsculas e minúsculas' },
  { id: 'title', label: 'Cada Palavra Maiúscula', group: 'Maiúsculas e minúsculas' },
  { id: 'sentence', label: 'Primeira maiúscula', group: 'Maiúsculas e minúsculas' },
  { id: 'camel', label: 'camelCase', group: 'Programação' },
  { id: 'snake', label: 'snake_case', group: 'Programação' },
  { id: 'kebab', label: 'kebab-case', group: 'Programação' },
  { id: 'no-accents', label: 'Tirar acentos', group: 'Programação' },
  { id: 'slug', label: 'Slug para link', group: 'Programação' },
  { id: 'trim-lines', label: 'Tirar linhas em branco', group: 'Linhas' },
  { id: 'unique-lines', label: 'Tirar linhas repetidas', group: 'Linhas' },
  { id: 'sort-lines', label: 'Ordenar A–Z', group: 'Linhas' },
  { id: 'reverse-lines', label: 'Inverter a ordem', group: 'Linhas' },
  { id: 'base64-encode', label: 'Base64: codificar', group: 'Codificação' },
  { id: 'base64-decode', label: 'Base64: decodificar', group: 'Codificação' },
  { id: 'url-encode', label: 'URL: codificar', group: 'Codificação' },
  { id: 'url-decode', label: 'URL: decodificar', group: 'Codificação' },
]

export const removeAccents = (text: string): string => text.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Palavras do texto, separando por espaço, símbolos e também por mudança de caixa (fooBar → foo, Bar). */
export function words(text: string): string[] {
  return removeAccents(text)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
}

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Decodifica Base64 (também a versão para URL); texto inválido lança erro. */
export function fromBase64(text: string): string {
  const clean = text.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(clean)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export type TransformResult = { ok: true; value: string } | { ok: false; error: string }

const ok = (value: string): TransformResult => ({ ok: true, value })

/** Aplica a transformação. Só a decodificação pode falhar (texto que não é Base64 ou URL válidos). */
export function applyTransform(id: TransformId, text: string): TransformResult {
  const lines = () => text.split(/\r?\n/)
  switch (id) {
    case 'upper':
      return ok(text.toLocaleUpperCase('pt-BR'))
    case 'lower':
      return ok(text.toLocaleLowerCase('pt-BR'))
    case 'title':
      return ok(text.toLocaleLowerCase('pt-BR').replace(/(^|[^\p{L}\p{N}'])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toLocaleUpperCase('pt-BR')))
    case 'sentence':
      return ok(text.toLocaleLowerCase('pt-BR').replace(/(^|[.!?]\s+|\n)(\p{L})/gu, (_, before: string, letter: string) => before + letter.toLocaleUpperCase('pt-BR')))
    case 'camel':
      return ok(words(text).map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word))).join(''))
    case 'snake':
      return ok(words(text).join('_').toLowerCase())
    case 'kebab':
    case 'slug':
      return ok(words(text).join('-').toLowerCase())
    case 'no-accents':
      return ok(removeAccents(text))
    case 'trim-lines':
      return ok(lines().filter((line) => line.trim() !== '').join('\n'))
    case 'unique-lines':
      return ok([...new Set(lines())].join('\n'))
    case 'sort-lines':
      return ok(lines().sort((a, b) => a.localeCompare(b, 'pt-BR')).join('\n'))
    case 'reverse-lines':
      return ok(lines().reverse().join('\n'))
    case 'base64-encode':
      return ok(toBase64(text))
    case 'base64-decode':
      try {
        return ok(fromBase64(text))
      } catch {
        return { ok: false, error: 'Esse texto não é um Base64 válido.' }
      }
    case 'url-encode':
      return ok(encodeURIComponent(text))
    case 'url-decode':
      try {
        return ok(decodeURIComponent(text))
      } catch {
        return { ok: false, error: 'Esse texto não é uma URL codificada válida.' }
      }
  }
}
