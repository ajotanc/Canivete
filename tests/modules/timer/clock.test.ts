import { describe, expect, it } from 'vitest'
import { DEFAULT_POMODORO, elapsed, formatClock, formatCountdown, idle, isRunning, nextPhase, pause, phaseMinutes, remainingMs, start } from '@/modules/timer/lib/clock'

describe('relógio', () => {
  it('começa parado e zerado', () => {
    expect(idle()).toEqual({ elapsedBefore: 0, startedAt: null })
    expect(isRunning(idle())).toBe(false)
    expect(elapsed(idle(), 5000)).toBe(0)
  })

  it('conta o tempo desde o início', () => {
    const run = start(idle(), 1000)
    expect(isRunning(run)).toBe(true)
    expect(elapsed(run, 4500)).toBe(3500)
  })

  it('pausa guarda o que correu e retomar soma', () => {
    const paused = pause(start(idle(), 1000), 3000)
    expect(paused).toEqual({ elapsedBefore: 2000, startedAt: null })
    expect(elapsed(paused, 99_000)).toBe(2000)
    expect(elapsed(start(paused, 10_000), 11_500)).toBe(3500)
  })

  it('começar de novo ou pausar parado não muda nada', () => {
    const running = start(idle(), 1000)
    expect(start(running, 2000)).toBe(running)
    expect(pause(idle(), 2000)).toEqual(idle())
  })

  it('relógio do aparelho voltando não dá tempo negativo', () => {
    expect(elapsed(start(idle(), 5000), 4000)).toBe(0)
  })
})

describe('formatação', () => {
  it('formata minutos, segundos e centésimos', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65_000)).toBe('01:05')
    expect(formatClock(65_420, true)).toBe('01:05.42')
    expect(formatClock(-5)).toBe('00:00')
  })

  it('passou de uma hora mostra as horas', () => {
    expect(formatClock(3_725_000)).toBe('1:02:05')
  })

  it('a contagem regressiva arredonda para cima', () => {
    expect(formatCountdown(59_001)).toBe('01:00')
    expect(formatCountdown(1)).toBe('00:01')
    expect(formatCountdown(0)).toBe('00:00')
  })
})

describe('contagem regressiva', () => {
  it('calcula o que falta e para no zero', () => {
    const run = start(idle(), 0)
    expect(remainingMs(10_000, run, 4000)).toBe(6000)
    expect(remainingMs(10_000, run, 50_000)).toBe(0)
  })
})

describe('pomodoro', () => {
  it('alterna foco e pausa, com pausa longa a cada 4 focos', () => {
    const config = DEFAULT_POMODORO
    expect(nextPhase('focus', 1, config)).toBe('short-break')
    expect(nextPhase('focus', 3, config)).toBe('short-break')
    expect(nextPhase('focus', 4, config)).toBe('long-break')
    expect(nextPhase('focus', 8, config)).toBe('long-break')
    expect(nextPhase('short-break', 1, config)).toBe('focus')
    expect(nextPhase('long-break', 4, config)).toBe('focus')
  })

  it('devolve a duração de cada fase', () => {
    expect(phaseMinutes('focus', DEFAULT_POMODORO)).toBe(25)
    expect(phaseMinutes('short-break', DEFAULT_POMODORO)).toBe(5)
    expect(phaseMinutes('long-break', DEFAULT_POMODORO)).toBe(15)
  })
})
