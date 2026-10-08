// @vitest-environment jsdom
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { play, resetSoundForTests, soundEnabled, toggleSound, type SoundName } from '@/core/effects/sound'
import { coinHitTimes, DICE_ROLL_MS, DICE_TABLE_HITS } from '@/modules/coin-dice/lib/roll'

const ALL: SoundName[] = ['tick', 'tap', 'whoosh', 'win', 'dice', 'toss', 'land', 'unseal', 'success', 'error', 'alarm', 'phase']

/** Um AudioContext de mentira que conta o que foi criado e anota quando cada som começa. */
function installFakeAudio() {
  const counts = { contexts: 0, oscillators: 0, sources: 0, resumes: 0 }
  /** Instantes (em segundos, a partir de agora) em que ruídos e notas começam. */
  const bursts: number[] = []
  const notes: number[] = []
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() })
  const node = () => ({ connect: vi.fn((next: unknown) => next) })
  class FakeContext {
    currentTime = 0
    sampleRate = 8000
    state = 'suspended'
    destination = node()
    constructor() {
      counts.contexts++
    }
    resume() {
      counts.resumes++
      return Promise.resolve()
    }
    createOscillator() {
      counts.oscillators++
      return { ...node(), type: 'sine', frequency: param(), start: vi.fn((at: number) => notes.push(at)), stop: vi.fn() }
    }
    createGain() {
      return { ...node(), gain: param() }
    }
    createBiquadFilter() {
      return { ...node(), type: 'bandpass', frequency: param(), Q: param() }
    }
    createBuffer(_channels: number, length: number) {
      return { getChannelData: () => new Float32Array(length) }
    }
    createBufferSource() {
      counts.sources++
      return { ...node(), buffer: null, start: vi.fn((at: number) => bursts.push(at)), stop: vi.fn() }
    }
  }
  vi.stubGlobal('AudioContext', FakeContext)
  Object.defineProperty(window, 'AudioContext', { value: FakeContext, configurable: true, writable: true })
  return { counts, bursts, notes }
}

const near = (list: number[], target: number, tolerance = 0.012) => list.some((at) => Math.abs(at - target) <= tolerance)

beforeEach(() => {
  localStorage.clear()
  soundEnabled.value = true
  resetSoundForTests()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('efeitos sonoros', () => {
  it('com o som desligado não cria nem toca nada', () => {
    const { counts } = installFakeAudio()
    soundEnabled.value = false
    for (const name of ALL) play(name)
    expect(counts).toEqual({ contexts: 0, oscillators: 0, sources: 0, resumes: 0 })
  })

  it('com o som ligado cada efeito cria notas ou ruído, e o contexto é criado uma vez só e retomado', () => {
    const { counts } = installFakeAudio()
    let clock = 1000
    for (const name of ALL) {
      const before = counts.oscillators + counts.sources
      vi.spyOn(performance, 'now').mockReturnValue((clock += 1000))
      play(name)
      expect(counts.oscillators + counts.sources, name).toBeGreaterThan(before)
    }
    expect(counts.contexts).toBe(1)
    expect(counts.resumes).toBeGreaterThan(0)
  })

  it('estalos muito próximos viram um só', () => {
    const { counts } = installFakeAudio()
    const now = vi.spyOn(performance, 'now')
    now.mockReturnValue(1000)
    play('tick')
    const first = counts.sources
    now.mockReturnValue(1010)
    play('tick')
    expect(counts.sources).toBe(first)
    now.mockReturnValue(1100)
    play('tick')
    expect(counts.sources).toBeGreaterThan(first)
  })

  it('navegador sem Web Audio não dá erro', () => {
    Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true, writable: true })
    expect(() => ALL.forEach((name) => play(name))).not.toThrow()
  })

  it('erro ao tocar não escapa', () => {
    class Broken {
      state = 'running'
      constructor() {
        throw new Error('sem som')
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: Broken, configurable: true, writable: true })
    expect(() => play('win')).not.toThrow()
  })

  it('a escolha de ligar e desligar fica guardada neste aparelho', async () => {
    installFakeAudio()
    toggleSound()
    expect(soundEnabled.value).toBe(false)
    await nextTick()
    expect(localStorage.getItem('canivete:sound')).toBe('false')
    toggleSound()
    expect(soundEnabled.value).toBe(true)
    await nextTick()
    expect(localStorage.getItem('canivete:sound')).toBe('true')
  })

  it('ao ligar o som toca um estalo de confirmação', () => {
    const { counts } = installFakeAudio()
    soundEnabled.value = false
    toggleSound()
    expect(counts.sources).toBeGreaterThan(0)
  })
})

describe('som sincronizado com o movimento', () => {
  it('os dados batem na mesa nos mesmos instantes da animação e ficam em silêncio no ar', () => {
    const { bursts } = installFakeAudio()
    play('dice')
    for (const hit of DICE_TABLE_HITS) expect(near(bursts, (hit * DICE_ROLL_MS) / 1000), `batida em ${hit}`).toBe(true)
    // Entre o sopro do arremesso e a primeira batida o dado está no ar: nada soa.
    expect(bursts.filter((at) => at > 0.42 && at < 0.54)).toEqual([])
  })

  it('mais dados fazem mais barulho, até 5', () => {
    const noteCount = (count: number) => {
      resetSoundForTests()
      const { counts } = installFakeAudio()
      play('dice', count)
      return counts.oscillators + counts.sources
    }
    expect(noteCount(3)).toBeGreaterThan(noteCount(1))
    expect(noteCount(20)).toBe(noteCount(5))
  })

  it('a moeda quica na mesa nos instantes da animação', () => {
    const { notes } = installFakeAudio()
    play('land')
    for (const time of coinHitTimes()) expect(near(notes, time, 0.006), `batida em ${time}s`).toBe(true)
  })

  it('a moeda ao pousar tem quiques cada vez mais rápidos', () => {
    const { notes } = installFakeAudio()
    play('land')
    const hits = [...new Set(notes.map((at) => Math.round(at * 1000)))].sort((a, b) => a - b)
    const gaps = hits.slice(1).map((at, index) => at - hits[index]).filter((gap) => gap > 5)
    // Tira os parciais que começam juntos; sobram os intervalos entre quiques, que diminuem.
    for (let index = 1; index < Math.min(gaps.length, 5); index++) expect(gaps[index]).toBeLessThanOrEqual(gaps[index - 1])
  })
})
