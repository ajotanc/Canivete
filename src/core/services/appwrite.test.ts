import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppwriteConfigError, getAppwrite, getAppwriteIds, resetAppwriteForTests } from './appwrite'

afterEach(() => {
  vi.unstubAllEnvs()
  resetAppwriteForTests()
})

describe('getAppwrite', () => {
  it('lança erro claro em português quando faltam variáveis', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', '')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', '')
    expect(() => getAppwrite()).toThrow(AppwriteConfigError)
    expect(() => getAppwrite()).toThrow(/não está configurado/i)
  })

  it('cria o cliente uma única vez', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(getAppwrite()).toBe(getAppwrite())
  })

  it('expõe o serviço TablesDB', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(typeof getAppwrite().tablesDB.createRow).toBe('function')
    expect(typeof getAppwrite().tablesDB.getRow).toBe('function')
  })
})

describe('getAppwriteIds', () => {
  it('lança erro quando falta o id do banco', () => {
    vi.stubEnv('VITE_APPWRITE_DATABASE_ID', '')
    expect(() => getAppwriteIds()).toThrow(AppwriteConfigError)
  })

  it('usa "raffles" como tabela padrão', () => {
    vi.stubEnv('VITE_APPWRITE_DATABASE_ID', 'db')
    vi.stubEnv('VITE_APPWRITE_RAFFLES_TABLE_ID', '')
    expect(getAppwriteIds()).toEqual({ databaseId: 'db', rafflesTableId: 'raffles' })
  })
})
