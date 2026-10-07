import { describe, expect, it } from 'vitest'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { SantaError } from '../../../functions/secret-santa/src/lib/errors'
import { toSlug } from '../../../functions/secret-santa/src/lib/validate'
import { enroll } from './enroll'
import { createFakeDb } from './fakeDb'
import { OWNER, STRANGER } from './owner'

async function errorOf(promise: Promise<unknown>): Promise<SantaError | undefined> {
  try {
    await promise
  } catch (error) {
    return error as SantaError
  }
  return undefined
}

async function newGroup(db = createFakeDb(), userId: string = OWNER.userId) {
  const data = (await handleAction(db, { action: 'createGroup', name: 'Família' }, { userId })) as {
    groupId: string
  }
  return { db, ...data }
}

/** Grupo sorteado com Ana, Bia e Caio, todos com PIN. */
async function drawnGroup() {
  const { db, groupId } = await newGroup()
  await enroll(db, groupId, { name: 'Ana', pin: '1111' })
  await enroll(db, groupId, { name: 'Bia', pin: '2222' })
  await enroll(db, groupId, { name: 'Caio', pin: '3333' })
  await handleAction(db, { action: 'draw', groupId }, OWNER)
  const pins: Record<string, string> = { Ana: '1111', Bia: '2222', Caio: '3333' }
  const who = (name: string) => ({ groupId, name, pin: pins[name] })
  return { db, groupId, who }
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
  it('normaliza o texto do link e não muda o id do grupo', async () => {
    const { db, groupId } = await newGroup()
    expect(await handleAction(db, { action: 'setSlug', groupId, slug: 'Família da Bagunça!' }, OWNER)).toEqual({
      slug: 'familia-da-bagunca',
    })
    const info = (await handleAction(db, { action: 'getGroup', groupId })) as { id: string; slug: string }
    expect(info).toMatchObject({ id: groupId, slug: 'familia-da-bagunca' })
  })

  it('vários grupos podem ter o mesmo texto no link', async () => {
    const first = await newGroup()
    const second = await newGroup(first.db)
    for (const g of [first, second]) {
      expect(await handleAction(g.db, { action: 'setSlug', groupId: g.groupId, slug: 'familia-buscape' }, OWNER)).toEqual({
        slug: 'familia-buscape',
      })
    }
    expect(first.groupId).not.toBe(second.groupId)
  })

  it('o próprio grupo pode repetir o endereço que já tem', async () => {
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'setSlug', groupId, slug: 'turma' }, OWNER)
    expect(await handleAction(db, { action: 'setSlug', groupId, slug: 'turma' }, OWNER)).toEqual({ slug: 'turma' })
  })

  it('só o organizador troca o endereço', async () => {
    const { db, groupId } = await newGroup()
    expect((await errorOf(handleAction(db, { action: 'setSlug', groupId, slug: 'turma' }, STRANGER)))?.code).toBe(
      'FORBIDDEN',
    )
  })

  it('recusa texto curto, inválido ou que seja rota do grupo', async () => {
    const { db, groupId } = await newGroup()
    for (const slug of ['ab', '!!', 'me', 'Admin']) {
      expect((await errorOf(handleAction(db, { action: 'setSlug', groupId, slug }, OWNER)))?.code).toBe(
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
    const { db, groupId } = await newGroup()
    await enroll(db, groupId, { name: 'Ana', pin: '1111' })
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

describe('deleteGroup', () => {
  it('apaga o grupo com participantes, perguntas e recados', async () => {
    const { db, groupId, who } = await drawnGroup()
    await handleAction(db, { action: 'postMessage', ...who('Ana'), text: 'Oi' })
    await handleAction(db, { action: 'askQuestion', ...who('Ana'), question: 'Chocolate ou vinho?' })
    const other = await newGroup(db)
    await handleAction(db, { action: 'deleteGroup', groupId }, OWNER)
    expect(db.groups.has(groupId)).toBe(false)
    expect([...db.participants.values()].some((p) => p.groupId === groupId)).toBe(false)
    expect(db.questions.size).toBe(0)
    expect(db.posts.length).toBe(0)
    expect(db.groups.has(other.groupId)).toBe(true)
  })

  it('só o dono apaga', async () => {
    const { db, groupId } = await newGroup()
    for (const caller of [undefined, STRANGER]) {
      expect((await errorOf(handleAction(db, { action: 'deleteGroup', groupId }, caller)))?.code).toBe('FORBIDDEN')
    }
    expect(db.groups.has(groupId)).toBe(true)
  })
})

describe('apagar recado', () => {
  type Listed = { posts: { id: string; text: string; canDelete: boolean }[] }

  it('quem escreveu apaga o seu; outra pessoa não apaga o dos outros', async () => {
    const { db, groupId, who } = await drawnGroup()
    await handleAction(db, { action: 'postMessage', ...who('Ana'), text: 'Oi' })
    const before = (await handleAction(db, { action: 'listPosts', ...who('Ana') })) as Listed
    expect(before.posts[0].canDelete).toBe(true)
    const others = (await handleAction(db, { action: 'listPosts', ...who('Bia') })) as Listed
    expect(others.posts[0].canDelete).toBe(false)

    const id = before.posts[0].id
    expect((await errorOf(handleAction(db, { action: 'deletePost', ...who('Bia'), postId: id })))?.code).toBe('FORBIDDEN')
    await handleAction(db, { action: 'deletePost', ...who('Ana'), postId: id })
    expect(((await handleAction(db, { action: 'listPosts', ...who('Ana'), groupId })) as Listed).posts).toHaveLength(0)
  })

  it('o organizador apaga qualquer recado e lê o mural sem PIN', async () => {
    const { db, groupId, who } = await drawnGroup()
    await handleAction(db, { action: 'postMessage', ...who('Ana'), text: 'Oi' })
    const listed = (await handleAction(db, { action: 'listPosts', groupId }, OWNER)) as Listed
    expect(listed.posts[0].canDelete).toBe(true)
    await handleAction(db, { action: 'deletePost', groupId, postId: listed.posts[0].id }, OWNER)
    expect(((await handleAction(db, { action: 'listPosts', groupId }, OWNER)) as Listed).posts).toHaveLength(0)
    expect((await errorOf(handleAction(db, { action: 'listPosts', groupId }, STRANGER)))?.code).toBeDefined()
  })
})
