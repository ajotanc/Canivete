/** Leitura de JWT (JSON Web Token). Só decodifica; confirmar a assinatura exige a chave, e só é feito para HS256, HS384 e HS512. */

export interface Decoded {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  /** As três partes como vieram, para colorir o token. */
  parts: [string, string, string]
}

export type DecodeResult = { ok: true; token: Decoded } | { ok: false; error: string }

/** Tira espaços, quebras de linha e o "Bearer " do começo. */
export const cleanToken = (text: string): string => text.trim().replace(/^bearer\s+/i, '').replace(/\s+/g, '')

/** Base64 para URL ("-" e "_", sem preenchimento) em bytes. Texto inválido lança erro. */
export function base64UrlToBytes(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

function decodeJson(part: string, name: string): Record<string, unknown> {
  let value: unknown
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(part)))
  } catch {
    throw new Error(`O ${name} não é um JSON válido em Base64.`)
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`O ${name} precisa ser um objeto JSON.`)
  return value as Record<string, unknown>
}

/** Decodifica cabeçalho e conteúdo. Erros voltam em português. */
export function decodeJwt(text: string): DecodeResult {
  const token = cleanToken(text)
  if (!token) return { ok: false, error: 'Cole um token.' }
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, error: `Um JWT tem 3 partes separadas por ponto; este tem ${parts.length}.` }
  try {
    return { ok: true, token: { header: decodeJson(parts[0], 'cabeçalho'), payload: decodeJson(parts[1], 'conteúdo'), parts: [parts[0], parts[1], parts[2]] } }
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : 'Token inválido.' }
  }
}

export type Expiry = 'valid' | 'expired' | 'not-yet' | 'no-expiry'

const seconds = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)

/** Situação do token pela data de expiração (`exp`) e de início (`nbf`). `now` em segundos Unix. */
export function expiryOf(payload: Record<string, unknown>, now: number): Expiry {
  const notBefore = seconds(payload.nbf)
  if (notBefore !== null && now < notBefore) return 'not-yet'
  const expires = seconds(payload.exp)
  if (expires === null) return 'no-expiry'
  return now >= expires ? 'expired' : 'valid'
}

/** "há 2 dias", "em 3 horas", "agora". */
export function relative(deltaSeconds: number): string {
  const abs = Math.abs(deltaSeconds)
  if (abs < 5) return 'agora'
  const [value, unit] = abs < 60 ? [Math.round(abs), 'segundo'] : abs < 3600 ? [Math.round(abs / 60), 'minuto'] : abs < 86_400 ? [Math.round(abs / 3600), 'hora'] : abs < 2_592_000 ? [Math.round(abs / 86_400), 'dia'] : abs < 31_536_000 ? [Math.round(abs / 2_592_000), 'mês'] : [Math.round(abs / 31_536_000), 'ano']
  const plural = unit === 'mês' ? (value === 1 ? 'mês' : 'meses') : value === 1 ? unit : `${unit}s`
  return deltaSeconds < 0 ? `há ${value} ${plural}` : `em ${value} ${plural}`
}

export interface Claim {
  name: string
  label: string
  value: string
  /** Para datas: a data legível e há quanto tempo (ou em quanto). */
  date?: { text: string; relative: string }
}

const DATE_CLAIMS: ReadonlyArray<[string, string]> = [
  ['exp', 'Expira em'],
  ['iat', 'Emitido em'],
  ['nbf', 'Válido a partir de'],
]
const TEXT_CLAIMS: ReadonlyArray<[string, string]> = [
  ['iss', 'Emissor'],
  ['sub', 'Assunto'],
  ['aud', 'Destinatário'],
  ['jti', 'Identificador'],
]

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'medium' })

/** Campos padrão do conteúdo, explicados; as datas vêm legíveis. */
export function describeClaims(payload: Record<string, unknown>, now: number): Claim[] {
  const claims: Claim[] = []
  for (const [name, label] of TEXT_CLAIMS) {
    if (payload[name] === undefined) continue
    const value = payload[name]
    claims.push({ name, label, value: Array.isArray(value) ? value.join(', ') : String(value) })
  }
  for (const [name, label] of DATE_CLAIMS) {
    const value = seconds(payload[name])
    if (value === null) continue
    claims.push({ name, label, value: String(value), date: { text: dateFormat.format(new Date(value * 1000)), relative: relative(value - now) } })
  }
  return claims
}

export type Verification = 'valid' | 'invalid' | 'unsupported'

const HASHES: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }

/** Confere a assinatura de um token HS256, HS384 ou HS512 com a chave. Outros algoritmos voltam `unsupported`. */
export async function verifyJwt(decoded: Decoded, secret: string, subtle: SubtleCrypto = crypto.subtle): Promise<Verification> {
  const hash = HASHES[String(decoded.header.alg)]
  if (!hash) return 'unsupported'
  const encoder = new TextEncoder()
  const key = await subtle.importKey('raw', encoder.encode(secret) as Uint8Array<ArrayBuffer>, { name: 'HMAC', hash }, false, ['verify'])
  try {
    const signature = base64UrlToBytes(decoded.parts[2]) as Uint8Array<ArrayBuffer>
    return (await subtle.verify('HMAC', key, signature, encoder.encode(`${decoded.parts[0]}.${decoded.parts[1]}`) as Uint8Array<ArrayBuffer>)) ? 'valid' : 'invalid'
  } catch {
    return 'invalid'
  }
}
