import { describe, expect, it } from 'vitest'
import { buildWhatsappLink, parsePhone } from '@/modules/whatsapp/lib/whatsapp'

describe('parsePhone', () => {
  it('assume o Brasil quando não há DDI', () => {
    expect(parsePhone('(11) 91234-5678')).toMatchObject({ digits: '5511912345678', valid: true, display: '+55 (11) 91234-5678' })
  })

  it('aceita fixo com 8 dígitos', () => {
    expect(parsePhone('11 3456-7890')).toMatchObject({ digits: '551134567890', valid: true, display: '+55 (11) 3456-7890' })
  })

  it('aceita o DDI 55 com ou sem "+"', () => {
    expect(parsePhone('+55 11 91234-5678').digits).toBe('5511912345678')
    expect(parsePhone('5511912345678').digits).toBe('5511912345678')
  })

  it('ignora zero à esquerda do DDD', () => {
    expect(parsePhone('011 91234-5678').digits).toBe('5511912345678')
  })

  it('aceita números de outros países com "+" ou 00', () => {
    expect(parsePhone('+1 415 555 2671')).toMatchObject({ digits: '14155552671', valid: true, display: '+14155552671' })
    expect(parsePhone('00351912345678').digits).toBe('351912345678')
  })

  it('rejeita números incompletos, DDD inválido e celular sem 9', () => {
    expect(parsePhone('91234-5678').valid).toBe(false)
    expect(parsePhone('(11) 9123-45').valid).toBe(false)
    expect(parsePhone('(10) 91234-5678').valid).toBe(false)
    expect(parsePhone('(11) 81234-5678').valid).toBe(false)
    expect(parsePhone('+1 23').valid).toBe(false)
  })

  it('campo vazio não é erro, só não é válido', () => {
    expect(parsePhone('  ')).toMatchObject({ valid: false, error: null, digits: '' })
  })
})

describe('buildWhatsappLink', () => {
  const phone = parsePhone('11 91234-5678')

  it('monta o link com a mensagem codificada', () => {
    expect(buildWhatsappLink(phone, 'Olá, tudo bem? R$ 10 & mais')).toBe(
      'https://api.whatsapp.com/send/?phone=5511912345678&text=Ol%C3%A1%2C%20tudo%20bem%3F%20R%24%2010%20%26%20mais',
    )
  })

  it('sem mensagem, deixa o texto vazio', () => {
    expect(buildWhatsappLink(phone, '  ')).toBe('https://api.whatsapp.com/send/?phone=5511912345678&text=')
  })

  it('telefone inválido não gera link', () => {
    expect(buildWhatsappLink(parsePhone('123'), 'oi')).toBe('')
  })
})
