// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearCredentials,
  loadAdminToken,
  loadCredentials,
  saveAdminToken,
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
    saveAdminToken('g1', 'tok')
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

describe('token do organizador', () => {
  it('guarda e lê em localStorage', () => {
    saveAdminToken('g1', 'tok')
    expect(loadAdminToken('g1')).toBe('tok')
    expect(loadAdminToken('g2')).toBeNull()
  })
})
