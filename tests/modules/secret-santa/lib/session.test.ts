// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from '@/modules/secret-santa/lib/session'

afterEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('credenciais da sessão', () => {
  it('guarda e lê nome e PIN por grupo, só em sessionStorage', () => {
    saveCredentials('g1', { name: 'Ana', pin: '1234' })
    expect(loadCredentials('g1')).toEqual({ name: 'Ana', pin: '1234' })
    expect(loadCredentials('g2')).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it('o PIN nunca vai para o localStorage', () => {
    saveCredentials('g1', { name: 'Ana', pin: '1234' })
    expect(JSON.stringify({ ...localStorage })).not.toContain('1234')
  })

  it('limpa as credenciais', () => {
    saveCredentials('g1', { name: 'Ana', pin: '1234' })
    clearCredentials('g1')
    expect(loadCredentials('g1')).toBeNull()
  })

  it('ignora valor corrompido', () => {
    sessionStorage.setItem('santa:cred:g1', '{ quebrado')
    expect(loadCredentials('g1')).toBeNull()
  })
})
