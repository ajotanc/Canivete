/** Dados de um sorteio que entram no hash. */
export interface RaffleRecord {
  participants: string[]
  winners: string[]
  drawnAt: string
}

/** JSON com ordem de chaves fixa, para que o hash seja reproduzível. */
export function canonicalJson(record: RaffleRecord): string {
  return JSON.stringify({
    participants: record.participants,
    winners: record.winners,
    drawnAt: record.drawnAt,
  })
}

/** SHA-256 em hexadecimal (64 caracteres) de um texto UTF-8. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Calcula o hash de um sorteio. */
export function computeHash(record: RaffleRecord): Promise<string> {
  return sha256Hex(canonicalJson(record))
}

/** Confere se o hash gravado ainda corresponde ao conteúdo do registro. */
export async function verifyRecord(record: RaffleRecord & { hash: string }): Promise<boolean> {
  return (await computeHash(record)) === record.hash
}
