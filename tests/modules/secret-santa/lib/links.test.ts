import { describe, expect, it } from 'vitest'
import { adminUrl, inviteUrl, whatsappUrl } from '@/modules/secret-santa/lib/links'

describe('links', () => {
  it('monta o link de convite', () => {
    expect(inviteUrl('https://x.com', 'abc')).toBe('https://x.com/secret-santa/g/abc')
  })

  it('põe o token do organizador no fragmento, nunca na query', () => {
    const url = adminUrl('https://x.com', 'abc', 'tok-1')
    expect(url).toBe('https://x.com/secret-santa/g/abc/admin#t=tok-1')
    expect(url).not.toContain('?')
  })

  it('monta o link do WhatsApp com texto codificado', () => {
    const url = whatsappUrl('Família & Cia', 'https://x.com/secret-santa/g/abc')
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length))
    expect(text).toContain('Família & Cia')
    expect(text).toContain('https://x.com/secret-santa/g/abc')
  })
})
