import { describe, expect, it } from 'vitest'
import { readConfig } from '../../../functions/secret-santa/src/config'

const base = { APPWRITE_ENDPOINT: 'https://x/v1', APPWRITE_PROJECT_ID: 'p', APPWRITE_API_KEY: 'k', SANTA_DATABASE_ID: 'db' }

describe('readConfig', () => {
  it('usa os ids padrão das tabelas quando não há variável', () => {
    expect(readConfig(base)).toMatchObject({
      groupsTableId: 'santa_groups',
      participantsTableId: 'santa_participants',
      questionsTableId: 'santa_questions',
      postsTableId: 'santa_posts',
    })
  })

  it('deixa as variáveis sobrescreverem as tabelas', () => {
    expect(readConfig({ ...base, SANTA_POSTS_TABLE_ID: 'meus_recados' }).postsTableId).toBe('meus_recados')
  })

  it('cai nas variáveis que a Appwrite injeta quando as próprias não existem', () => {
    const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, ...rest } = base
    void APPWRITE_ENDPOINT
    void APPWRITE_PROJECT_ID
    const config = readConfig({ ...rest, APPWRITE_FUNCTION_API_ENDPOINT: 'https://auto/v1', APPWRITE_FUNCTION_PROJECT_ID: 'auto' })
    expect(config).toMatchObject({ endpoint: 'https://auto/v1', projectId: 'auto' })
  })

  it('a variável própria ganha da injetada', () => {
    expect(readConfig({ ...base, APPWRITE_FUNCTION_API_ENDPOINT: 'https://auto/v1' }).endpoint).toBe('https://x/v1')
  })

  it('avisa quais variáveis faltam', () => {
    expect(() => readConfig({ ...base, SANTA_DATABASE_ID: '' })).toThrow(/Faltam variáveis.*SANTA_DATABASE_ID/)
  })
})
