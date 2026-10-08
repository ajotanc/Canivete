import { useStorage } from '@vueuse/core'

/**
 * Efeitos sonoros sintetizados na hora pelo Web Audio, sem arquivos de áudio.
 * Todos tocam a partir de um clique ou toque (o navegador exige isso para liberar o som).
 * A pessoa liga e desliga o som pelo botão do cabeçalho; a escolha fica guardada neste aparelho.
 */
export const soundEnabled = useStorage('canivete:sound', true)

export type SoundName =
  /** Estalo curto: o ponteiro da roleta batendo num pino. */
  | 'tick'
  /** Roleta começando a girar. */
  | 'whoosh'
  /** Resultado: um arpejo curto e brilhante. */
  | 'win'
  /** Dados chacoalhando e caindo. */
  | 'dice'
  /** Moeda lançada ao ar. */
  | 'toss'
  /** Moeda quicando ao pousar. */
  | 'land'
  /** Carta selada se abrindo. */
  | 'unseal'

const MASTER_VOLUME = 0.6
/** Intervalo mínimo entre dois estalos, em ms, para uma roleta rápida não virar um zumbido. */
const TICK_GAP_MS = 28

let context: AudioContext | null = null
let noise: AudioBuffer | null = null
let lastTick = Number.NEGATIVE_INFINITY

/** O contexto de áudio, criado na primeira vez e retomado se o navegador o suspendeu. Sem som ligado ou sem suporte, `null`. */
function audio(): AudioContext | null {
  if (!soundEnabled.value) return null
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) return null
    context ??= new Context()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

interface ToneOptions {
  /** Frequência inicial, em Hz. */
  frequency: number
  /** Se informada, a frequência desliza até ela durante a nota. */
  glideTo?: number
  type?: OscillatorType
  /** Quando começa, em segundos a partir de agora. */
  at?: number
  duration: number
  volume: number
}

/** Uma nota com ataque rápido e queda suave. */
function tone(ac: AudioContext, { frequency, glideTo, type = 'sine', at = 0, duration, volume }: ToneOptions): void {
  const start = ac.currentTime + at
  const oscillator = ac.createOscillator()
  const gain = ac.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume * MASTER_VOLUME, start + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(ac.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

interface BurstOptions {
  at?: number
  duration: number
  volume: number
  /** Frequência central do filtro, em Hz; define se o ruído soa como estalo (agudo) ou como sopro (grave). */
  frequency: number
  /** Se informada, o filtro desliza até ela (para o sopro subir ou descer). */
  sweepTo?: number
  q?: number
}

/** Um sopro de ruído filtrado: serve de estalo, madeira ou papel. */
function burst(ac: AudioContext, { at = 0, duration, volume, frequency, sweepTo, q = 1 }: BurstOptions): void {
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
    const data = noise.getChannelData(0)
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1
  }
  const start = ac.currentTime + at
  const source = ac.createBufferSource()
  const filter = ac.createBiquadFilter()
  const gain = ac.createGain()
  source.buffer = noise
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(frequency, start)
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume * MASTER_VOLUME, start + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter).connect(gain).connect(ac.destination)
  source.start(start, Math.random() * 0.5)
  source.stop(start + duration + 0.02)
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min)

const SOUNDS: Record<SoundName, (ac: AudioContext) => void> = {
  tick: (ac) => {
    burst(ac, { duration: 0.03, volume: 0.45, frequency: rand(2300, 3000), q: 1.4 })
    tone(ac, { frequency: rand(1400, 1700), glideTo: 800, duration: 0.03, volume: 0.1 })
  },
  whoosh: (ac) => {
    burst(ac, { duration: 0.55, volume: 0.22, frequency: 500, sweepTo: 2600, q: 0.7 })
  },
  win: (ac) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(ac, { frequency, type: 'triangle', at: index * 0.09, duration: 0.4, volume: 0.22 }))
    tone(ac, { frequency: 2093, at: 0.38, duration: 0.6, volume: 0.1 })
    tone(ac, { frequency: 3136, at: 0.46, duration: 0.5, volume: 0.06 })
  },
  dice: (ac) => {
    // Estalos de madeira, cada vez mais espaçados, e a batida final do dado parando.
    ;[0, 0.05, 0.11, 0.18, 0.26, 0.35, 0.46, 0.58, 0.72].forEach((at) => {
      burst(ac, { at, duration: 0.04, volume: rand(0.3, 0.55), frequency: rand(700, 1900), q: 2 })
      tone(ac, { frequency: rand(220, 360), glideTo: 140, at, duration: 0.04, volume: 0.1 })
    })
    tone(ac, { frequency: 150, glideTo: 70, at: 0.8, duration: 0.14, volume: 0.35 })
    burst(ac, { at: 0.8, duration: 0.06, volume: 0.3, frequency: 600, q: 1 })
  },
  toss: (ac) => {
    tone(ac, { frequency: 2600, duration: 0.7, volume: 0.2 })
    tone(ac, { frequency: 3900, duration: 0.4, volume: 0.08 })
    burst(ac, { duration: 0.3, volume: 0.1, frequency: 900, sweepTo: 2200, q: 0.6 })
  },
  land: (ac) => {
    ;[
      { at: 0, frequency: 2200, duration: 0.28, volume: 0.24 },
      { at: 0.11, frequency: 2050, duration: 0.2, volume: 0.17 },
      { at: 0.19, frequency: 1900, duration: 0.15, volume: 0.12 },
      { at: 0.25, frequency: 1800, duration: 0.12, volume: 0.08 },
    ].forEach((ping) => {
      tone(ac, ping)
      tone(ac, { ...ping, frequency: ping.frequency * 1.5, volume: ping.volume * 0.4 })
    })
    burst(ac, { duration: 0.05, volume: 0.25, frequency: 3200, q: 1.5 })
  },
  unseal: (ac) => {
    // Papel rasgando, uma subida de brilho e o tilintar da carta aberta.
    burst(ac, { duration: 0.24, volume: 0.3, frequency: 3400, sweepTo: 1400, q: 0.8 })
    tone(ac, { frequency: 380, glideTo: 1250, duration: 0.32, volume: 0.14 })
    ;[1318.5, 1568, 1975.5, 2637].forEach((frequency, index) => tone(ac, { frequency, type: 'triangle', at: 0.18 + index * 0.07, duration: 0.3, volume: 0.13 }))
  },
}

/** Toca um efeito, se o som estiver ligado. Nunca lança erro: sem som, a tela segue igual. */
export function play(name: SoundName): void {
  const ac = audio()
  if (!ac) return
  if (name === 'tick') {
    const now = performance.now()
    if (now - lastTick < TICK_GAP_MS) return
    lastTick = now
  }
  try {
    SOUNDS[name](ac)
  } catch {
    // Sem som: o efeito visual continua valendo.
  }
}

/** Liga ou desliga o som; ao ligar, toca um estalo para a pessoa ouvir que funcionou. */
export function toggleSound(): void {
  soundEnabled.value = !soundEnabled.value
  if (soundEnabled.value) play('tick')
}

/** Só para os testes: volta ao estado inicial. */
export function resetSoundForTests(): void {
  context = null
  noise = null
  lastTick = Number.NEGATIVE_INFINITY
}
