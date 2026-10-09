import { describe, expect, it } from 'vitest'
import { COVER, coverFileProblem, fitInside } from '@/modules/secret-santa/lib/cover'

describe('fitInside', () => {
  it('reduz a foto para caber no cabeçalho sem distorcer', () => {
    expect(fitInside({ width: 4000, height: 3000 })).toEqual({ width: 1333, height: 1000 })
    expect(fitInside({ width: 6000, height: 2000 })).toEqual({ width: 1600, height: 533 })
  })

  it('não aumenta foto pequena', () => {
    expect(fitInside({ width: 800, height: 400 })).toEqual({ width: 800, height: 400 })
  })
})

describe('coverFileProblem', () => {
  it('aceita fotos comuns', () => {
    expect(coverFileProblem({ type: 'image/jpeg', size: 3_000_000 })).toBeNull()
    expect(coverFileProblem({ type: 'image/heic', size: 3_000_000 })).toBeNull()
  })

  it('recusa o que não é foto e foto grande demais', () => {
    expect(coverFileProblem({ type: 'application/pdf', size: 10 })).toMatch(/JPG/)
    expect(coverFileProblem({ type: 'image/svg+xml', size: 10 })).toMatch(/JPG/)
    expect(coverFileProblem({ type: 'image/png', size: (COVER.maxInputMb + 1) * 1024 * 1024 })).toMatch(/grande demais/)
  })
})
