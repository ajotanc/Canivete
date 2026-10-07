import { describe, expect, it } from 'vitest'
import { inviteUrl, whatsappDrawnUrl, whatsappPendingUrl, whatsappUrl } from '@/modules/secret-santa/lib/links'

describe('links', () => {
  it('monta o link de convite', () => {
    expect(inviteUrl('https://x.com', 'abc')).toBe('https://x.com/secret-santa/g/abc')
  })

  it('põe o texto bonito depois do id', () => {
    expect(inviteUrl('https://x.com', 'k7x2m9', 'familia-buscape')).toBe('https://x.com/secret-santa/g/k7x2m9/familia-buscape')
  })

  it('monta o link do WhatsApp com texto codificado', () => {
    const url = whatsappUrl('Família & Cia', 'https://x.com/secret-santa/g/abc')
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length))
    expect(text).toContain('Família & Cia')
    expect(text).toContain('https://x.com/secret-santa/g/abc')
  })

  it('monta o aviso de sorteio feito, com o link e sem citar pares', () => {
    const url = whatsappDrawnUrl('Turma', 'https://x.com/secret-santa/g/abc')
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length))
    expect(text).toContain('Turma')
    expect(text).toContain('https://x.com/secret-santa/g/abc')
  })

  it('monta um aviso único para quem ainda não criou o PIN', () => {
    const url = whatsappPendingUrl('Turma', ['Ana', 'Bia'], 'https://x.com/secret-santa/g/abc')
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length))
    expect(text).toContain('Ana, Bia')
    expect(text).toContain('https://x.com/secret-santa/g/abc')
  })
})
