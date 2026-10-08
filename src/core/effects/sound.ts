import { useStorage } from '@vueuse/core'

/**
 * Efeitos sonoros sintetizados na hora pelo Web Audio, sem arquivos de áudio.
 * Todos tocam a partir de um clique ou toque (o navegador exige isso para liberar o som).
 * A pessoa liga e desliga o som pelo botão do cabeçalho; a escolha fica guardada neste aparelho.
 */
export const soundEnabled = useStorage('canivete:sound', true)

export type SoundName =
  /** Estalo curto: o ponteiro da roleta batendo num pino, um nome passando no sorteio. */
  | 'tick'
  /** Toque leve de botão: iniciar, pausar, marcar volta. */
  | 'tap'
  /** Roleta começando a girar. */
  | 'whoosh'
  /** Resultado: um arpejo curto e brilhante. */
  | 'win'
  /** Dados no ar e quicando na mesa; o último quique é o da animação. */
  | 'dice'
  /** Moeda lançada ao ar: o piparote e o zunido do giro. */
  | 'toss'
  /** Moeda caindo na mesa: quiques cada vez mais rápidos até parar. */
  | 'land'
  /** Carta selada: o lacre de cera estalando, o papel abrindo e um sino suave. */
  | 'unseal'
  /** Deu certo (validação, assinatura conferida). */
  | 'success'
  /** Deu errado. */
  | 'error'
  /** Fim do timer: três bipes, duas vezes. */
  | 'alarm'
  /** Troca de fase do Pomodoro: duas notas de sino. */
  | 'phase'

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

/** Parciais de uma barra de metal: a razão entre elas não é inteira, e é isso que faz uma moeda soar como metal e não como flauta. */
const METAL_PARTIALS: ReadonlyArray<readonly [ratio: number, gain: number, life: number]> = [
  [1, 1, 1],
  [2.76, 0.5, 0.6],
  [5.4, 0.28, 0.35],
  [8.93, 0.14, 0.2],
]

/** Um "tim" de metal: o tom e seus parciais, que se apagam mais rápido quanto mais agudos. */
function metal(ac: AudioContext, { frequency, at = 0, duration, volume }: { frequency: number; at?: number; duration: number; volume: number }): void {
  for (const [ratio, gain, life] of METAL_PARTIALS) {
    if (frequency * ratio < 14_000) tone(ac, { frequency: frequency * ratio, at, duration: duration * life, volume: volume * gain })
  }
}

/** Um tom que treme (tremolo), como a moeda girando no ar. */
function warble(ac: AudioContext, { frequency, at = 0, duration, volume, rate }: { frequency: number; at?: number; duration: number; volume: number; rate: number }): void {
  const start = ac.currentTime + at
  const carrier = ac.createOscillator()
  const gain = ac.createGain()
  const lfo = ac.createOscillator()
  const depth = ac.createGain()
  carrier.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume * MASTER_VOLUME, start + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  lfo.frequency.setValueAtTime(rate, start)
  depth.gain.setValueAtTime(volume * MASTER_VOLUME * 0.6, start)
  lfo.connect(depth).connect(gain.gain)
  carrier.connect(gain).connect(ac.destination)
  carrier.start(start)
  lfo.start(start)
  carrier.stop(start + duration + 0.02)
  lfo.stop(start + duration + 0.02)
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min)

/** Uma batida na mesa: o baque grave, o estalo da madeira e um toc. */
function knock(ac: AudioContext, at: number, strength: number): void {
  tone(ac, { frequency: rand(150, 190) * (0.8 + strength * 0.4), glideTo: 70, at, duration: 0.05 + strength * 0.1, volume: 0.1 + strength * 0.3 })
  burst(ac, { at, duration: 0.03 + strength * 0.03, volume: 0.15 + strength * 0.45, frequency: rand(900, 1500), q: 2 })
  tone(ac, { frequency: rand(300, 380), glideTo: 200, at, duration: 0.03, volume: 0.05 + strength * 0.08 })
}

/**
 * A receita de cada efeito. Os tempos dos dados e da moeda seguem as animações (veja `DiceFace.vue` e `CoinPiece.vue`),
 * para o som e o movimento caírem juntos.
 */
const SOUNDS: Record<SoundName, (ac: AudioContext, count: number) => void> = {
  tick: (ac) => {
    burst(ac, { duration: 0.03, volume: 0.45, frequency: rand(2300, 3000), q: 1.4 })
    tone(ac, { frequency: rand(1400, 1700), glideTo: 800, duration: 0.03, volume: 0.1 })
  },
  tap: (ac) => {
    burst(ac, { duration: 0.02, volume: 0.35, frequency: 1800, q: 3 })
    tone(ac, { frequency: 650, glideTo: 450, duration: 0.035, volume: 0.09 })
  },
  whoosh: (ac) => {
    burst(ac, { duration: 0.55, volume: 0.22, frequency: 500, sweepTo: 2600, q: 0.7 })
  },
  win: (ac) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(ac, { frequency, type: 'triangle', at: index * 0.09, duration: 0.4, volume: 0.22 }))
    tone(ac, { frequency: 2093, at: 0.38, duration: 0.6, volume: 0.1 })
    tone(ac, { frequency: 3136, at: 0.46, duration: 0.5, volume: 0.06 })
  },
  dice: (ac, count) => {
    // Cada dado tem o próprio ar e as próprias batidas, um pouco defasados. Os tempos seguem a animação (900 ms):
    // sobe até 300 ms, cai e bate em 560 ms, quica de novo e bate em 830 ms, assenta em 880 ms.
    const dice = Math.min(Math.max(count, 1), 5)
    const share = 1 / Math.sqrt(dice)
    for (let die = 0; die < dice; die++) {
      const jitter = die === 0 ? 0 : rand(0, 0.045)
      burst(ac, { at: jitter, duration: 0.4, volume: 0.1 * share, frequency: 450, sweepTo: 1900, q: 0.7 })
      knock(ac, 0.56 + jitter, 1 * share)
      ;[0.61, 0.67, 0.73, 0.79].forEach((at, index) => burst(ac, { at: at + jitter, duration: 0.03, volume: (0.3 - index * 0.05) * share, frequency: rand(800, 1700), q: 2 }))
      knock(ac, 0.83 + jitter, 0.55 * share)
      knock(ac, 0.88 + jitter, 0.25 * share)
    }
  },
  toss: (ac) => {
    // O piparote do polegar, o "tim" da moeda e o zunido dela girando no ar.
    burst(ac, { duration: 0.04, volume: 0.3, frequency: 1800, q: 1 })
    metal(ac, { frequency: 2900, duration: 0.5, volume: 0.24 })
    warble(ac, { frequency: 2300, at: 0.05, duration: 1.1, volume: 0.05, rate: 17 })
  },
  land: (ac) => {
    // Quiques na mesa cada vez mais rápidos (a moeda se acomodando), do tempo das batidas da animação em diante.
    const hits = [0, 0.165, 0.262, 0.33, 0.378, 0.412, 0.436, 0.452, 0.464, 0.473]
    hits.forEach((at, index) => {
      const fade = Math.max(0.12, 1 - index * 0.11)
      metal(ac, { frequency: (2150 + rand(-140, 140)) * (1 + index * 0.012), at, duration: Math.max(0.08, 0.3 - index * 0.025), volume: 0.26 * fade })
    })
    tone(ac, { frequency: 190, glideTo: 90, duration: 0.09, volume: 0.2 })
    burst(ac, { at: 0.47, duration: 0.09, volume: 0.07, frequency: 4300, q: 2 })
  },
  unseal: (ac) => {
    // O lacre de cera estala, o papel se desdobra e um sino suave fecha.
    burst(ac, { duration: 0.04, volume: 0.6, frequency: 900, q: 0.8 })
    tone(ac, { frequency: 170, glideTo: 60, duration: 0.07, volume: 0.28 })
    burst(ac, { at: 0.05, duration: 0.025, volume: 0.35, frequency: 1700, q: 1.2 })
    burst(ac, { at: 0.12, duration: 0.13, volume: 0.15, frequency: 3600, sweepTo: 2400, q: 0.9 })
    burst(ac, { at: 0.25, duration: 0.11, volume: 0.12, frequency: 2800, sweepTo: 4200, q: 0.9 })
    burst(ac, { at: 0.36, duration: 0.15, volume: 0.1, frequency: 2600, q: 0.9 })
    burst(ac, { at: 0.5, duration: 0.08, volume: 0.07, frequency: 4000, q: 1 })
    tone(ac, { frequency: 659.25, at: 0.52, duration: 1, volume: 0.12 })
    tone(ac, { frequency: 987.77, at: 0.58, duration: 1, volume: 0.09 })
    tone(ac, { frequency: 1318.5, at: 0.52, duration: 0.5, volume: 0.03 })
  },
  success: (ac) => {
    tone(ac, { frequency: 783.99, type: 'triangle', duration: 0.18, volume: 0.2 })
    tone(ac, { frequency: 1046.5, type: 'triangle', at: 0.09, duration: 0.32, volume: 0.22 })
  },
  error: (ac) => {
    tone(ac, { frequency: 190, glideTo: 150, type: 'triangle', duration: 0.13, volume: 0.28 })
    tone(ac, { frequency: 170, glideTo: 130, type: 'triangle', at: 0.15, duration: 0.2, volume: 0.28 })
  },
  alarm: (ac) => {
    ;[0, 0.85].forEach((group) => [0, 0.2, 0.4].forEach((at) => tone(ac, { frequency: 988, type: 'triangle', at: group + at, duration: 0.13, volume: 0.32 })))
  },
  phase: (ac) => {
    metal(ac, { frequency: 880, duration: 0.7, volume: 0.22 })
    metal(ac, { frequency: 1318.5, at: 0.17, duration: 0.9, volume: 0.2 })
  },
}

/** Toca um efeito, se o som estiver ligado. `count` só importa para os dados (quantos caem juntos). Nunca lança erro: sem som, a tela segue igual. */
export function play(name: SoundName, count = 1): void {
  const ac = audio()
  if (!ac) return
  if (name === 'tick') {
    const now = performance.now()
    if (now - lastTick < TICK_GAP_MS) return
    lastTick = now
  }
  try {
    SOUNDS[name](ac, count)
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
