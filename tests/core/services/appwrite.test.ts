import { afterEach, describe, expect, it, vi } from 'vitest'
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

describe('getAppwrite (functions)', () => {
  it('expõe o serviço Functions', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(typeof getAppwrite().functions.createExecution).toBe('function')
  })
})

describe('getSantaFunctionId', () => {
  it('lança AppwriteConfigError quando faltar a variável', () => {
    vi.stubEnv('VITE_APPWRITE_SANTA_FUNCTION_ID', '')
    expect(() => getSantaFunctionId()).toThrow(AppwriteConfigError)
  })

  it('devolve o id configurado', () => {
    vi.stubEnv('VITE_APPWRITE_SANTA_FUNCTION_ID', 'secret-santa')
    expect(getSantaFunctionId()).toBe('secret-santa')
  })
})

describe('santaCoverUrl', () => {
  it('monta o endereço público do arquivo no bucket de capas', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1/')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    vi.stubEnv('VITE_APPWRITE_SANTA_COVERS_BUCKET_ID', '')
    expect(santaCoverUrl('abc123')).toBe('https://example.test/v1/storage/buckets/santa_covers/files/abc123/view?project=proj')
    vi.stubEnv('VITE_APPWRITE_SANTA_COVERS_BUCKET_ID', 'capas')
    expect(santaCoverUrl('abc123')).toContain('/buckets/capas/files/abc123/')
  })

  it('sem imagem ou sem configuração devolve null', () => {
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1')
    vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'proj')
    expect(santaCoverUrl(null)).toBeNull()
    vi.stubEnv('VITE_APPWRITE_ENDPOINT', '')
    expect(santaCoverUrl('abc123')).toBeNull()
  })
})
