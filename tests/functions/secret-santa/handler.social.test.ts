import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { SantaError } from '../../../functions/secret-santa/src/lib/errors'
import { toSlug } from '../../../functions/secret-santa/src/lib/validate'
import { enroll } from './enroll'
import { createFakeDb } from './fakeDb'

async function errorOf(promise: Promise<unknown>): Promise<SantaError | undefined> {
  try {
    await promise
  } catch (error) {
    return error as SantaError
  }
  return undefined
}

async function newGroup(db = createFakeDb(), userId: string | null = null) {
  const data = (await handleAction(db, { action: 'createGroup', name: 'Família' }, { userId })) as {
    groupId: string
    adminToken: string
  }
  return { db, ...data }
}

/** Grupo sorteado com Ana, Bia e Caio, todos com PIN. */
async function drawnGroup() {
  const { db, groupId, adminToken } = await newGroup()
  await enroll(db, groupId, adminToken, { name: 'Ana', pin: '1111' })
  await enroll(db, groupId, adminToken, { name: 'Bia', pin: '2222' })
  await enroll(db, groupId, adminToken, { name: 'Caio', pin: '3333' })
  await handleAction(db, { action: 'draw', groupId, adminToken })
  const pins: Record<string, string> = { Ana: '1111', Bia: '2222', Caio: '3333' }
  const who = (name: string) => ({ groupId, name, pin: pins[name] })
  return { db, groupId, adminToken, who }
}

describe('dono do grupo', () => {
  it('grava o dono e lista só os grupos dele', async () => {
    const db = createFakeDb()
    await newGroup(db, 'user-1')
    await newGroup(db, 'user-1')
    await newGroup(db, 'user-2')
    const mine = (await handleAction(db, { action: 'listMyGroups' }, { userId: 'user-1' })) as { groups: unknown[] }
    expect(mine.groups).toHaveLength(2)
  })

  it('sem sessão a lista é vazia', async () => {
    const db = createFakeDb()
    await newGroup(db, 'user-1')
    expect(await handleAction(db, { action: 'listMyGroups' })).toEqual({ groups: [] })
  })

  it('o dono administra sem token; outra sessão não', async () => {
    const { db, groupId } = await newGroup(createFakeDb(), 'user-1')
    const ok = await handleAction(db, { action: 'listParticipants', groupId }, { userId: 'user-1' })
    expect(ok).toMatchObject({ status: 'open' })
    expect((await errorOf(handleAction(db, { action: 'listParticipants', groupId }, { userId: 'user-2' })))?.code).toBe(
      'FORBIDDEN',
    )
    expect((await errorOf(handleAction(db, { action: 'listParticipants', groupId })))?.code).toBe('FORBIDDEN')
  })
})

describe('setSlug', () => {
  it('normaliza o texto e passa a achar o grupo pelo endereço', async () => {
    const { db, groupId, adminToken } = await newGroup()
    expect(await handleAction(db, { action: 'setSlug', groupId, adminToken, slug: 'Família da Bagunça!' })).toEqual({
      slug: 'familia-da-bagunca',
    })
    const info = (await handleAction(db, { action: 'getGroup', groupId: 'familia-da-bagunca' })) as { id: string }
    expect(info.id).toBe(groupId)
  })

  it('recusa endereço em uso e sugere livres', async () => {
    const first = await newGroup()
    await handleAction(first.db, { action: 'setSlug', groupId: first.groupId, adminToken: first.adminToken, slug: 'turma' })
    const second = await newGroup(first.db)
    const error = await errorOf(
      handleAction(second.db, { action: 'setSlug', groupId: second.groupId, adminToken: second.adminToken, slug: 'turma' }),
    )
    expect(error?.code).toBe('SLUG_TAKEN')
    expect(error?.details).toEqual({ suggestions: ['turma-2', 'turma-3', 'turma-4'] })
  })

  it('o próprio grupo pode repetir o endereço que já tem', async () => {
    const { db, groupId, adminToken } = await newGroup()
    await handleAction(db, { action: 'setSlug', groupId, adminToken, slug: 'turma' })
    expect(await handleAction(db, { action: 'setSlug', groupId, adminToken, slug: 'turma' })).toEqual({ slug: 'turma' })
  })

  it('só o organizador troca o endereço', async () => {
    const { db, groupId } = await newGroup()
    expect((await errorOf(handleAction(db, { action: 'setSlug', groupId, adminToken: 'x', slug: 'turma' })))?.code).toBe(
      'FORBIDDEN',
    )
  })

  it('recusa endereço curto ou parecido com um id', async () => {
    const { db, groupId, adminToken } = await newGroup()
    for (const slug of ['ab', '!!', 'abcdef0123456789abcd']) {
      expect((await errorOf(handleAction(db, { action: 'setSlug', groupId, adminToken, slug })))?.code).toBe(
        'INVALID_INPUT',
      )
    }
  })

  it('toSlug tira acentos e junta separadores', () => {
    expect(toSlug('  Amigo   Secreto -- 2026 ')).toBe('amigo-secreto-2026')
  })
})

describe('perguntas anônimas', () => {
  it('vão para quem foi tirado, sem revelar o autor, e a resposta volta só para o autor', async () => {
    const { db, who } = await drawnGroup()
    const giver = 'Ana'
    const receiver = ((await handleAction(db, { action: 'reveal', ...who(giver) })) as { receiver: { name: string } })
      .receiver.name

    await handleAction(db, { action: 'askQuestion', ...who(giver), question: 'Chocolate ou vinho?' })

    const inbox = (await handleAction(db, { action: 'listQuestions', ...who(receiver) })) as {
      received: { id: string; question: string; answer: string | null }[]
      sent: unknown[]
    }
    expect(inbox.received).toEqual([{ id: expect.any(String), question: 'Chocolate ou vinho?', answer: null }])
    expect(JSON.stringify(inbox)).not.toContain(giver)

    await handleAction(db, { action: 'answerQuestion', ...who(receiver), questionId: inbox.received[0].id, answer: 'Vinho' })

    const mine = (await handleAction(db, { action: 'listQuestions', ...who(giver) })) as {
      sent: { question: string; answer: string | null }[]
    }
    expect(mine.sent).toEqual([{ id: expect.any(String), question: 'Chocolate ou vinho?', answer: 'Vinho' }])
  })

  it('não dá para perguntar antes do sorteio', async () => {
    const { db, groupId, adminToken } = await newGroup()
    await enroll(db, groupId, adminToken, { name: 'Ana', pin: '1111' })
    const error = await errorOf(
      handleAction(db, { action: 'askQuestion', groupId, name: 'Ana', pin: '1111', question: 'Oi?' }),
    )
    expect(error?.code).toBe('INVALID_INPUT')
  })

  it('só quem recebeu a pergunta consegue responder', async () => {
    const { db, who } = await drawnGroup()
    await handleAction(db, { action: 'askQuestion', ...who('Ana'), question: 'Cor favorita?' })
    const [question] = [...db.questions.values()]
    // Quem perguntou não é quem recebeu: não pode responder a própria pergunta.
    const outsider = 'Ana'
    const error = await errorOf(
      handleAction(db, { action: 'answerQuestion', ...who(outsider), questionId: question.id, answer: 'Azul' }),
    )
    expect(error?.code).toBe('INVALID_INPUT')
  })

  it('exige PIN correto e limita o tamanho', async () => {
    const { db, groupId, who } = await drawnGroup()
    expect(
      (await errorOf(handleAction(db, { action: 'askQuestion', groupId, name: 'Ana', pin: '9999', question: 'Oi?' })))?.code,
    ).toBe('BAD_CREDENTIALS')
    expect(
      (await errorOf(handleAction(db, { action: 'askQuestion', ...who('Ana'), question: 'x'.repeat(201) })))?.code,
    ).toBe('INVALID_INPUT')
  })
})

describe('mural de recados', () => {
  it('mostra o nome de quem escreveu, do mais novo ao mais antigo', async () => {
    const { db, who } = await drawnGroup()
    await handleAction(db, { action: 'postMessage', ...who('Ana'), text: 'Quem leva o bolo?' })
    await handleAction(db, { action: 'postMessage', ...who('Bia'), text: 'Eu levo!' })
    const { posts } = (await handleAction(db, { action: 'listPosts', ...who('Caio') })) as {
      posts: { author: string; text: string }[]
    }
    expect(posts.map((p) => [p.author, p.text])).toEqual([
      ['Bia', 'Eu levo!'],
      ['Ana', 'Quem leva o bolo?'],
    ])
  })

  it('exige PIN e não aceita recado vazio', async () => {
    const { db, groupId, who } = await drawnGroup()
    expect(
      (await errorOf(handleAction(db, { action: 'listPosts', groupId, name: 'Ana', pin: '9999' })))?.code,
    ).toBe('BAD_CREDENTIALS')
    expect((await errorOf(handleAction(db, { action: 'postMessage', ...who('Ana'), text: '  ' })))?.code).toBe(
      'INVALID_INPUT',
    )
  })
})
