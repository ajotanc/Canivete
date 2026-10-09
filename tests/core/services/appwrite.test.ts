import { afterEach, describe, expect, it, vi } from 'vitest'
import { APPWRITE_IDS } from '@/core/config'
import {
  AppwriteConfigError,
  getAppwrite,
  getAppwriteIds,
  getSantaFunctionId,
  resetAppwriteForTests,
  santaCoverUrl,
} from '@/core/services/appwrite'

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
  it('usa os ids fixos do código, sem depender do .env', () => {
    expect(getAppwriteIds()).toEqual({ databaseId: APPWRITE_IDS.databaseId, rafflesTableId: 'raffles' })
  })
})

describe('getAppwrite (functions)', () => {
  it('expõe o serviço Functions', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(typeof getAppwrite().functions.createExecution).toBe('function')
  })
})

describe('getSantaFunctionId', () => {
  it('devolve o id fixo da Function', () => {
    expect(getSantaFunctionId()).toBe('secret-santa')
  })
})

describe('santaCoverUrl', () => {
  it('monta o endereço público do arquivo no bucket de capas', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1/')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(santaCoverUrl('abc123')).toBe('https://example.test/v1/storage/buckets/santa_covers/files/abc123/view?project=proj')
  })

  it('sem imagem ou sem configuração devolve null', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(santaCoverUrl(null)).toBeNull()
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', '')
    expect(santaCoverUrl('abc123')).toBeNull()
  })
})
