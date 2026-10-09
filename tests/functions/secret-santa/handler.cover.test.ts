import { describe, expect, it } from 'vitest'
import { LIMITS } from '../../../functions/secret-santa/src/config'
import { handleAction } from '../../../functions/secret-santa/src/handler'
import { parseCoverImage } from '../../../functions/secret-santa/src/lib/validate'
import { createFakeDb } from './fakeDb'
import { OWNER, STRANGER } from './owner'

/** Um WebP mínimo e válido no cabeçalho: RIFF, tamanho declarado que bate com o arquivo e a marca WEBP. */
function webp(payload = 8): string {
  const bytes = Buffer.alloc(12 + payload)
  bytes.write('RIFF', 0, 'latin1')
  bytes.writeUInt32LE(bytes.length - 8, 4)
  bytes.write('WEBP', 8, 'latin1')
  bytes.write('VP8 ', 12, 'latin1')
  return bytes.toString('base64')
}

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}

async function newGroup() {
  const db = createFakeDb()
  const { groupId } = (await handleAction(db, { action: 'createGroup', name: 'Família' }, OWNER)) as { groupId: string }
  return { db, groupId }
}

describe('parseCoverImage', () => {
  it('aceita WebP em base64, com ou sem o prefixo data:', () => {
    expect(parseCoverImage(webp()).length).toBe(20)
    expect(parseCoverImage(`data:image/webp;base64,${webp()}`).length).toBe(20)
  })

  it('recusa outro formato, arquivo cortado, texto que não é base64 e imagem grande demais', () => {
    const png = Buffer.from('\x89PNG\r\n\x1a\n0000000000000000', 'latin1').toString('base64')
    const cut = Buffer.from(webp(), 'base64').subarray(0, 18).toString('base64')
    expect(() => parseCoverImage(png)).toThrow('WebP')
    expect(() => parseCoverImage(cut)).toThrow('WebP')
    expect(() => parseCoverImage('não é base64!')).toThrow()
    expect(() => parseCoverImage(null)).toThrow()
    expect(() => parseCoverImage(webp(LIMITS.coverBytes))).toThrow('grande demais')
  })
})

describe('setCover', () => {
  it('só o dono do grupo põe a imagem', async () => {
    const { db, groupId } = await newGroup()
    expect(await errorCode(handleAction(db, { action: 'setCover', groupId, image: webp() }, STRANGER))).toBe('FORBIDDEN')
    expect(await errorCode(handleAction(db, { action: 'setCover', groupId, image: webp() }))).toBe('FORBIDDEN')
    expect(db.covers.size).toBe(0)
  })

  it('grava a imagem no bucket e o grupo passa a mostrá-la', async () => {
    const { db, groupId } = await newGroup()
    const { cover } = (await handleAction(db, { action: 'setCover', groupId, image: webp() }, OWNER)) as { cover: string }
    expect(db.covers.has(cover)).toBe(true)
    const group = (await handleAction(db, { action: 'getGroup', groupId })) as { cover: string | null }
    expect(group.cover).toBe(cover)
  })

  it('ao trocar, apaga a imagem anterior do bucket', async () => {
    const { db, groupId } = await newGroup()
    const first = (await handleAction(db, { action: 'setCover', groupId, image: webp() }, OWNER)) as { cover: string }
    const second = (await handleAction(db, { action: 'setCover', groupId, image: webp(16) }, OWNER)) as { cover: string }
    expect(second.cover).not.toBe(first.cover)
    expect([...db.covers.keys()]).toEqual([second.cover])
  })

  it('com image null tira a imagem e apaga o arquivo', async () => {
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'setCover', groupId, image: webp() }, OWNER)
    expect(await handleAction(db, { action: 'setCover', groupId, image: null }, OWNER)).toEqual({ cover: null })
    expect(db.covers.size).toBe(0)
    expect(db.groups.get(groupId)!.cover).toBeNull()
  })

  it('imagem inválida não toca no bucket nem na imagem atual', async () => {
    const { db, groupId } = await newGroup()
    const { cover } = (await handleAction(db, { action: 'setCover', groupId, image: webp() }, OWNER)) as { cover: string }
    expect(await errorCode(handleAction(db, { action: 'setCover', groupId, image: 'AAAA' }, OWNER))).toBe('INVALID_INPUT')
    expect([...db.covers.keys()]).toEqual([cover])
    expect(db.groups.get(groupId)!.cover).toBe(cover)
  })

  it('se o grupo não for atualizado, a imagem nova sai do bucket e a antiga fica', async () => {
    const { db, groupId } = await newGroup()
    const { cover } = (await handleAction(db, { action: 'setCover', groupId, image: webp() }, OWNER)) as { cover: string }
    db.failNextCoverUpdate()
    await expect(handleAction(db, { action: 'setCover', groupId, image: webp(16) }, OWNER)).rejects.toThrow()
    expect([...db.covers.keys()]).toEqual([cover])
    expect(db.groups.get(groupId)!.cover).toBe(cover)
  })

  it('excluir o grupo apaga a imagem dele', async () => {
    const { db, groupId } = await newGroup()
    await handleAction(db, { action: 'setCover', groupId, image: webp() }, OWNER)
    await handleAction(db, { action: 'deleteGroup', groupId }, OWNER)
    expect(db.covers.size).toBe(0)
  })
})
