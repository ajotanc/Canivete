/** Menor texto de link aceito (igual ao da Function) e nomes que são rotas do grupo. */
export const MIN_SLUG = 3
const RESERVED_SLUGS = new Set(['me', 'admin'])

/** Vale para enviar? Texto curto demais ou reservado é descartado em vez de dar erro. */
export function isUsableSlug(value: string): boolean {
  return value.length >= MIN_SLUG && !RESERVED_SLUGS.has(value)
}

/** Tira os hífens das pontas (o do fim aparece enquanto a pessoa digita um espaço). */
export function trimSlug(value: string): string {
  return value.replace(/^-+|-+$/g, '')
}

/**
 * Ajusta o endereço enquanto a pessoa digita: sem acento, minúsculas, e espaços ou símbolos viram "-".
 * Mantém o "-" do fim, porque a pessoa ainda está digitando; `trimSlug` o tira ao sair do campo.
 */
export function slugifyInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
}
