import { Confetti } from 'vue-confetti'
import type { ConfettiStartOptions } from 'vue-confetti'

const DEFAULT_DURATION_MS = 3000
const FADE_MS = 3500

/** Cores padrão da chuva de confetes do Canivete (família das cores de ferramenta). */
export const CONFETTI_COLORS = ['#2457F5', '#0E7C57', '#E5322D', '#F2B600', '#FFFFFF']

export interface ConfettiOptions {
  colors?: string[]
  /** Quanto tempo a chuva dura antes de sumir. */
  durationMs?: number
}

let instance: Confetti | null = null
let fadeAnimation: Animation | null = null
let stopTimer: number | undefined
let removeTimer: number | undefined

function getConfetti(): Confetti {
  instance ??= new Confetti()
  return instance
}

function getCanvas(): HTMLCanvasElement | null {
  return document.querySelector<HTMLCanvasElement>('#confetti-canvas, canvas[id*="confetti"]')
}

/** A biblioteca cria o canvas no primeiro start; aqui ele é fixado e esticado na tela toda. */
function fitCanvas(): void {
  const canvas = getCanvas()
  if (!canvas) return
  fadeAnimation?.cancel()
  fadeAnimation = null
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '1',
  })
}

function fadeOutCanvas(): void {
  fadeAnimation = getCanvas()?.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-out', fill: 'forwards' }) ?? null
}

/** Para a chuva e remove o canvas. Seguro de chamar várias vezes. */
export function disposeConfetti(): void {
  window.clearTimeout(stopTimer)
  window.clearTimeout(removeTimer)
  fadeAnimation?.cancel()
  fadeAnimation = null
  try {
    instance?.stop()
    instance?.remove()
  } catch {
    // Já removido: nada a fazer.
  }
}

/**
 * Dispara uma chuva de confetes em tela cheia. Com "reduzir movimento" ligado, cai menos e some mais cedo.
 * Núcleo reaproveitável: qualquer ferramenta pode chamar para celebrar um resultado.
 */
export function triggerConfetti({ colors = CONFETTI_COLORS, durationMs = DEFAULT_DURATION_MS }: ConfettiOptions = {}): void {
  if (typeof window === 'undefined') return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.clearTimeout(stopTimer)
  window.clearTimeout(removeTimer)

  const options: ConfettiStartOptions = {
    particles: [{ type: 'rect', size: 7 }],
    defaultType: 'rect',
    defaultColors: colors,
    defaultSize: 7,
    defaultDropRate: 8,
    particlesPerFrame: reduced ? 1 : 3,
    windSpeedMax: 1,
  }

  try {
    const confetti = getConfetti()
    // O primeiro start cria o canvas; depois de ajustar o tamanho, reinicia para medir a largura certa.
    confetti.start(options)
    fitCanvas()
    confetti.stop()
    confetti.start(options)
    fitCanvas()
    const duration = reduced ? Math.min(durationMs, 1800) : durationMs
    stopTimer = window.setTimeout(fadeOutCanvas, duration)
    removeTimer = window.setTimeout(disposeConfetti, duration + FADE_MS)
  } catch {
    disposeConfetti()
  }
}
