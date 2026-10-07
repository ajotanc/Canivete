/** Regras do link de WhatsApp: normalizar o telefone e montar o endereço api.whatsapp.com/send. */

export const BR_DDI = '55'
/** Tamanho a partir do qual avisamos que a mensagem pode ficar grande demais para o link. */
export const MESSAGE_LIMIT = 1000

export interface ParsedPhone {
  /** Só dígitos, com DDI (ex.: 5511912345678). Vazio se o campo está vazio. */
  digits: string
  valid: boolean
  /** Número para exibir (ex.: +55 (11) 91234-5678). */
  display: string
  /** O que está errado, em português; null se válido ou vazio. */
  error: string | null
}

const EMPTY: ParsedPhone = { digits: '', valid: false, display: '', error: null }

function formatBrazilian(digits: string): string {
  const ddd = digits.slice(2, 4)
  const local = digits.slice(4)
  const split = local.length - 4
  return `+55 (${ddd}) ${local.slice(0, split)}-${local.slice(split)}`
}

/**
 * Lê o telefone digitado. Sem DDI, assume Brasil (55): aceita DDD + 8 ou 9 dígitos.
 * Com "+" (ou 00) e outro país, aceita de 8 a 15 dígitos (padrão E.164).
 */
export function parsePhone(input: string): ParsedPhone {
  const trimmed = input.trim()
  if (!trimmed) return EMPTY

  const international = trimmed.startsWith('+') || trimmed.startsWith('00')
  let digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('00')) digits = digits.slice(2)
  if (!international) digits = digits.replace(/^0+/, '')

  if (international && !digits.startsWith(BR_DDI)) {
    const valid = digits.length >= 8 && digits.length <= 15
    return {
      digits,
      valid,
      display: `+${digits}`,
      error: valid ? null : 'Número internacional com tamanho inválido (de 8 a 15 dígitos, com o código do país).',
    }
  }

  // Brasil: com DDI vem 12 ou 13 dígitos; sem, 10 ou 11.
  const national = digits.startsWith(BR_DDI) && digits.length >= 12 ? digits.slice(2) : digits
  const full = `${BR_DDI}${national}`

  if (national.length < 10 || national.length > 11) {
    return { digits: full, valid: false, display: `+${full}`, error: 'Informe o DDD e o número (10 ou 11 dígitos).' }
  }
  if (!/^[1-9][1-9]/.test(national)) {
    return { digits: full, valid: false, display: `+${full}`, error: 'DDD inválido (de 11 a 99, sem zero).' }
  }
  if (national.length === 11 && national[2] !== '9') {
    return { digits: full, valid: false, display: `+${full}`, error: 'Celular com 11 dígitos começa com 9 depois do DDD.' }
  }
  return { digits: full, valid: true, display: formatBrazilian(full), error: null }
}

/** Monta https://api.whatsapp.com/send/?phone=<número>&text=<mensagem>. Devolve '' se o telefone for inválido. */
export function buildWhatsappLink(phone: ParsedPhone, message: string): string {
  if (!phone.valid) return ''
  return `https://api.whatsapp.com/send/?phone=${phone.digits}&text=${encodeURIComponent(message.trim())}`
}
