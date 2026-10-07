import { describe, expect, it } from 'vitest'
import * as fn from '../../../functions/secret-santa/src/config'
import * as site from '@/modules/secret-santa/constants'

// O site mostra os limites nos campos; quem decide de verdade é a Function. Os dois arquivos precisam concordar.
describe('constantes do site e da Function', () => {
  it('têm os mesmos limites de texto e quantidade', () => {
    const shared = ['groupName', 'personName', 'wishlistItems', 'wishlistText', 'wishlistUrl', 'question', 'answer', 'post', 'slugMin', 'slugMax'] as const
    for (const key of shared) expect(site.LIMITS[key], key).toBe(fn.LIMITS[key])
  })

  it('exigem o mesmo número de pessoas para sortear', () => {
    expect(site.MIN_PARTICIPANTS_TO_DRAW).toBe(fn.DRAW.minParticipants)
  })

  it('têm as mesmas cores, a cor padrão, o contraste e os endereços reservados', () => {
    expect([...site.GROUP_COLORS]).toEqual([...fn.GROUP_COLORS])
    expect(site.DEFAULT_GROUP_COLOR).toBe(fn.DEFAULT_GROUP_COLOR)
    expect(site.COLOR_LUMINANCE).toEqual(fn.COLOR_LUMINANCE)
    expect([...site.RESERVED_SLUGS].sort()).toEqual([...fn.RESERVED_SLUGS].sort())
  })

  it('o PIN da tela cabe no que a Function aceita (4 a 6 números)', () => {
    expect(site.PIN_LENGTH).toBeGreaterThanOrEqual(4)
    expect(site.PIN_LENGTH).toBeLessThanOrEqual(6)
  })
})
