/**
 * Relógio por diferença de horário: guarda o que já correu e quando a contagem atual começou.
 * Assim a conta continua certa mesmo se a aba ficar em segundo plano (onde os temporizadores atrasam).
 */
export interface Run {
  /** Milissegundos acumulados nas contagens anteriores (antes da última pausa). */
  elapsedBefore: number
  /** Horário em que a contagem atual começou; `null` se está parado. */
  startedAt: number | null
}

export const idle = (): Run => ({ elapsedBefore: 0, startedAt: null })

export const isRunning = (run: Run): boolean => run.startedAt !== null

export const elapsed = (run: Run, now: number): number => run.elapsedBefore + (run.startedAt === null ? 0 : Math.max(0, now - run.startedAt))

export const start = (run: Run, now: number): Run => (run.startedAt === null ? { ...run, startedAt: now } : run)

export const pause = (run: Run, now: number): Run => (run.startedAt === null ? run : { elapsedBefore: elapsed(run, now), startedAt: null })

/** "01:05" ou, com centésimos, "01:05.42". Passa de 1 hora vira "1:01:05". */
export function formatClock(ms: number, centis = false): string {
  const safe = Math.max(0, Math.floor(ms))
  const totalSeconds = Math.floor(safe / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const two = (value: number) => String(value).padStart(2, '0')
  const base = hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`
  return centis ? `${base}.${two(Math.floor((safe % 1000) / 10))}` : base
}

/** Tempo restante arredondado para cima: a contagem regressiva mostra "00:01" até o último milissegundo. */
export const remainingMs = (durationMs: number, run: Run, now: number): number => Math.max(0, durationMs - elapsed(run, now))

export const formatCountdown = (ms: number): string => formatClock(Math.ceil(ms / 1000) * 1000)

export type PomodoroPhase = 'focus' | 'short-break' | 'long-break'

export interface PomodoroConfig {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  /** Quantos focos antes da pausa longa. */
  cyclesBeforeLong: number
}

export const DEFAULT_POMODORO: PomodoroConfig = { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLong: 4 }

export function phaseMinutes(phase: PomodoroPhase, config: PomodoroConfig): number {
  return phase === 'focus' ? config.focusMinutes : phase === 'short-break' ? config.shortBreakMinutes : config.longBreakMinutes
}

/** Próxima fase depois de terminar `phase`, sabendo quantos focos já foram concluídos (contando este). */
export function nextPhase(phase: PomodoroPhase, completedFocus: number, config: PomodoroConfig): PomodoroPhase {
  if (phase !== 'focus') return 'focus'
  return completedFocus % config.cyclesBeforeLong === 0 ? 'long-break' : 'short-break'
}
