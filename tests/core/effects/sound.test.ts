// @vitest-environment jsdom
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { play, resetSoundForTests, soundEnabled, toggleSound, type SoundName } from '@/core/effects/sound'

const ALL: SoundName[] = ['tick', 'whoosh', 'win', 'dice', 'toss', 'land', 'unseal']

/** Um AudioContext de mentira que só conta o que foi criado. */
function installFakeAudio() {
  const counts = { contexts: 0, oscillators: 0, sources: 0, resumes: 0 }
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
      return { ...node(), type: 'sine', frequency: param(), start: vi.fn(), stop: vi.fn() }
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
      return { ...node(), buffer: null, start: vi.fn(), stop: vi.fn() }
    }
  }
  vi.stubGlobal('AudioContext', FakeContext)
  Object.defineProperty(window, 'AudioContext', { value: FakeContext, configurable: true, writable: true })
  return counts
}

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
    const counts = installFakeAudio()
    soundEnabled.value = false
    for (const name of ALL) play(name)
    expect(counts).toEqual({ contexts: 0, oscillators: 0, sources: 0, resumes: 0 })
  })

  it('com o som ligado cada efeito cria notas ou ruído, e o contexto é criado uma vez só e retomado', () => {
    const counts = installFakeAudio()
    for (const name of ALL) {
      const before = counts.oscillators + counts.sources
      vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 1000)
      play(name)
      expect(counts.oscillators + counts.sources).toBeGreaterThan(before)
    }
    expect(counts.contexts).toBe(1)
    expect(counts.resumes).toBeGreaterThan(0)
  })

  it('o dado faz vários estalos e a moeda ao pousar quica mais de uma vez', () => {
    const counts = installFakeAudio()
    play('dice')
    expect(counts.sources).toBeGreaterThanOrEqual(9)
    const afterDice = counts.oscillators
    play('land')
    expect(counts.oscillators - afterDice).toBeGreaterThanOrEqual(8)
  })

  it('estalos muito próximos viram um só', () => {
    const counts = installFakeAudio()
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
    expect(() => ALL.forEach(play)).not.toThrow()
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
    const counts = installFakeAudio()
    soundEnabled.value = false
    toggleSound()
    expect(counts.sources).toBeGreaterThan(0)
  })
})
