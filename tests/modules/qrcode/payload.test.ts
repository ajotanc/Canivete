import { describe, expect, it } from 'vitest'
import { contactPayload, wifiPayload } from '@/modules/qrcode/lib/payload'

describe('wifiPayload', () => {
  it('monta o formato WIFI com senha', () => {
    expect(wifiPayload({ ssid: 'Casa', password: 'segredo123', security: 'WPA', hidden: false })).toBe('WIFI:T:WPA;S:Casa;P:segredo123;;')
  })

  it('escapa ; , : " e \\ no nome e na senha', () => {
    expect(wifiPayload({ ssid: 'A;B', password: 'x:y"z\\', security: 'WPA', hidden: true })).toBe('WIFI:T:WPA;S:A\\;B;P:x\\:y\\"z\\\\;H:true;;')
  })

  it('rede aberta não leva senha', () => {
    expect(wifiPayload({ ssid: 'Aberta', password: 'ignorada', security: 'nopass', hidden: false })).toBe('WIFI:T:nopass;S:Aberta;;')
  })

  it('sem nome da rede não gera nada', () => {
    expect(wifiPayload({ ssid: ' ', password: '', security: 'WPA', hidden: false })).toBe('')
  })
})

describe('contactPayload', () => {
  it('monta o vCard só com os campos preenchidos', () => {
    expect(contactPayload({ name: 'Ana Souza', phone: '+5511912345678', email: '', organization: 'Padaria; Cia', url: '' })).toBe(
      ['BEGIN:VCARD', 'VERSION:3.0', 'FN:Ana Souza', 'N:Ana Souza;;;;', 'ORG:Padaria\\; Cia', 'TEL;TYPE=CELL:+5511912345678', 'END:VCARD'].join('\n'),
    )
  })

  it('sem nome não gera nada', () => {
    expect(contactPayload({ name: '', phone: '1', email: '', organization: '', url: '' })).toBe('')
  })
})
